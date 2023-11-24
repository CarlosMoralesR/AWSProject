const { S3Client } = require("@aws-sdk/client-s3");
const aws = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
  accessKeyId: "ASIAU3SHNCDUAAOJVLV2",
  secretAccessKey: "Mq3E1c3LqQP80LI8y3jzgrBimywKmum4gVxNUXWg",
  sessionToken:
    "FwoGZXIvYXdzEA4aDLyCWZqBulP9QVv4lCLPAQea1XrIAebAsLvrsBx9RsJaQrGrq+1sVpyqF3vEjI/cutI4wuB9OnYu31LfWzGM1tauqc72aw/EguB5gr9lZG9PrBdvbZEGlrEN4kdQaUE6U3XqJo+J2qq1RwTGpYdPXy52kWmILeuPhHM/c7WJWSO6jTBBL3AvUasxFdpMvk+GJS9cpAmgpsvmiaqRsH2TyDWieHEX9kpMkNGAA37j2xFdmgyFGLQEglJAZZAfCj3RE0KLhowlxL53bwPu0KwzdzeRCyo/wGjH8ek+VZC5LiiVxoCrBjItnfgsA9kqrI0zNLcMGeoDTiw2E1IQzz65tRQltIbgTgEdC8m8htOsuTOUY83J",
  region: "us-east-1",
});

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "ASIAU3SHNCDUAAOJVLV2",
    secretAccessKey: "Mq3E1c3LqQP80LI8y3jzgrBimywKmum4gVxNUXWg",
    sessionToken:
      "FwoGZXIvYXdzEA4aDLyCWZqBulP9QVv4lCLPAQea1XrIAebAsLvrsBx9RsJaQrGrq+1sVpyqF3vEjI/cutI4wuB9OnYu31LfWzGM1tauqc72aw/EguB5gr9lZG9PrBdvbZEGlrEN4kdQaUE6U3XqJo+J2qq1RwTGpYdPXy52kWmILeuPhHM/c7WJWSO6jTBBL3AvUasxFdpMvk+GJS9cpAmgpsvmiaqRsH2TyDWieHEX9kpMkNGAA37j2xFdmgyFGLQEglJAZZAfCj3RE0KLhowlxL53bwPu0KwzdzeRCyo/wGjH8ek+VZC5LiiVxoCrBjItnfgsA9kqrI0zNLcMGeoDTiw2E1IQzz65tRQltIbgTgEdC8m8htOsuTOUY83J",
  },
});

const sns = new aws.SNS();

// Configuración de AWS DynamoDB
const dynamoDB = new aws.DynamoDB.DocumentClient();
const tableName = "sesiones-alumnos";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "carlosdanielmoralesreinisch",
    acl: "public-read",
    key: function (req, file, cb) {
      cb(
        null,
        "alumnos/" +
          req.params.id +
          "/" +
          Date.now().toString() +
          "-" +
          file.originalname
      );
    },
  }),
});

// Validación de campos
function validarCampos(req, res, next) {
  const { nombres, apellidos } = req.body;
  if (!nombres || !apellidos) {
    return res
      .status(400)
      .json({ error: "Los campos nombres y apellidos son obligatorios." });
  }
  next();
}

// Validación de tipo de dato
function validarTipoDeDato(req, res, next) {
  const { promedio, horasClase } = req.body;
  if (promedio && isNaN(promedio)) {
    return res.status(400).json({ error: "El promedio debe ser un número." });
  }
  if (horasClase && isNaN(horasClase)) {
    return res
      .status(400)
      .json({ error: "Las horas de clase deben ser un número." });
  }
  next();
}

// Alumnos
// GET ALUMNOS
app.get("/alumnos", async (req, res) => {
  const alumnos = await prisma.alumno.findMany();
  res.status(200).json(alumnos);
});

// GET ALUMNOS POR ID
app.get("/alumnos/:id", async (req, res) => {
  const alumno = await prisma.alumno.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  res.json(alumno);
});

// CREAR ALUMNOS
app.post("/alumnos", validarCampos, async (req, res) => {
  const { nombres, apellidos, matricula, promedio, password } = req.body;

  try {
    const alumno = await prisma.alumno.create({
      data: {
        nombres,
        apellidos,
        matricula,
        promedio: Number(promedio),
        fotoPerfilUrl: "",
        password,
      },
    });
    res.status(201).json(alumno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el alumno." });
  }
});

// POST /alumnos/{id}/fotoPerfil
app.post("/alumnos/:id/fotoPerfil", upload.single("foto"), async (req, res) => {
  const id = parseInt(req.params.id);

  // Verificar si el alumno existe antes de intentar actualizar la foto de perfil
  const alumnoExistente = await prisma.alumno.findUnique({
    where: { id },
  });

  if (!alumnoExistente) {
    return res.status(404).json({ error: "Alumno no encontrado." });
  }

  // Obtener la URL de la imagen cargada en S3
  const fotoPerfilUrl = req.file.location;

  // Actualizar el campo fotoPerfilUrl en la base de datos
  try {
    const alumno = await prisma.alumno.update({
      where: { id },
      data: { fotoPerfilUrl },
    });

    res.json(alumno);
    console.log(alumno);
    console.log(fotoPerfilUrl);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error al actualizar la foto de perfil del alumno." });
  }
});

// POST EMAIL
app.post("/alumnos/:id/email", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Obtén la información del alumno
    const alumno = await prisma.alumno.findUnique({
      where: { id },
    });

    // Verifica si el alumno existe
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado." });
    }

    // Construye el mensaje
    const mensaje = `Información del alumno: Nombre: ${alumno.nombres} Apellido: ${alumno.apellidos} Promedio: ${alumno.promedio}`;

    // Publica el mensaje en el topic de SNS
    await sns
      .publish({
        TopicArn: "arn:aws:sns:us-east-1:334083461352:aws-topic",
        Subject: "Notificación de Calificaciones",
        Message: mensaje,
      })
      .promise();

    res.json({ mensaje: "Notificación enviada con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar la notificación." });
  }
});

// EDITAR ALUMNOS
app.put("/alumnos/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  // Verificar si el alumno existe antes de intentar editarlo
  const alumnoExistente = await prisma.alumno.findUnique({
    where: { id },
  });

  if (!alumnoExistente) {
    return res.status(404).json({ error: "Alumno no encontrado." });
  }

  // Obtén los campos que se enviaron en la solicitud
  const { nombres, apellidos, matricula, promedio } = req.body;

  // Construye el objeto data solo con los campos que se enviaron
  const data = {};
  if (nombres !== undefined) data.nombres = nombres;
  if (apellidos !== undefined) data.apellidos = apellidos;
  if (matricula !== undefined) data.matricula = matricula;
  if (promedio !== undefined) data.promedio = Number(promedio);

  try {
    // Actualiza el alumno solo con los campos proporcionados
    const alumno = await prisma.alumno.update({
      where: { id },
      data,
    });

    res.json(alumno);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error:
        "Error al actualizar el alumno. Verifica los campos proporcionados.",
    });
  }
});

// ELIMINAR ALUMNOS
app.delete("/alumnos/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  // Verificar si el alumno existe antes de intentar eliminarlo
  const alumnoExistente = await prisma.alumno.findUnique({
    where: { id },
  });

  if (!alumnoExistente) {
    return res.status(404).json({ error: "Alumno no encontrado." });
  }

  try {
    await prisma.alumno.delete({
      where: { id },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el alumno." });
  }
});

app.all("/alumnos", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// Profesores
// GET PROFESORES
app.get("/profesores", async (req, res) => {
  const profesores = await prisma.profesor.findMany();
  res.status(200).json(profesores);
});

// GET PROFESORES POR ID
app.get("/profesores/:id", async (req, res) => {
  const profesor = await prisma.profesor.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!profesor)
    return res.status(404).json({ error: "Profesor no encontrado." });
  res.json(profesor);
});

// CREAR PROFESORES
app.post("/profesores", validarCampos, async (req, res) => {
  const { numeroEmpleado, nombres, apellidos, horasClase } = req.body;

  try {
    const profesor = await prisma.profesor.create({
      data: {
        numeroEmpleado,
        nombres,
        apellidos,
        horasClase: Number(horasClase),
      },
    });
    res.status(201).json(profesor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el profesor." });
  }
});

// Función para validar número de empleado único
function validarNumeroEmpleadoUnico(req, res, next) {
  const { numeroEmpleado } = req.body;
  if (
    profesores.some((profesor) => profesor.numeroEmpleado === numeroEmpleado)
  ) {
    return res.status(400).json({
      error: "Ya existe un profesor con el mismo número de empleado.",
    });
  }
  next();
}

// EDITAR PROFESORES
app.put("/profesores/:id", validarTipoDeDato, async (req, res) => {
  const id = parseInt(req.params.id);

  // Verificar si el profesor existe antes de intentar editarlo
  const profesorExistente = await prisma.profesor.findUnique({
    where: { id },
  });

  if (!profesorExistente) {
    return res.status(404).json({ error: "Profesor no encontrado." });
  }

  // Obtén los campos que se enviaron en la solicitud
  const { nombres, apellidos, numeroEmpleado, horasClase } = req.body;

  // Construye el objeto data solo con los campos que se enviaron
  const data = {};
  if (nombres !== undefined) data.nombres = nombres;
  if (apellidos !== undefined) data.apellidos = apellidos;
  if (numeroEmpleado !== undefined) data.numeroEmpleado = numeroEmpleado;
  if (horasClase !== undefined) data.horasClase = Number(horasClase);

  try {
    // Actualiza el profesor solo con los campos proporcionados
    const profesor = await prisma.profesor.update({
      where: { id },
      data,
    });

    res.json(profesor);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error:
        "Error al actualizar al profesor. Verifica los campos proporcionados.",
    });
  }
});

// ELIMINAR PROFESORES
app.delete("/profesores/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  // Verificar si el profesor existe antes de intentar eliminarlo
  const profesorExistente = await prisma.profesor.findUnique({
    where: { id },
  });

  if (!profesorExistente) {
    return res.status(404).json({ error: "Profesor no encontrado." });
  }

  try {
    await prisma.profesor.delete({
      where: { id },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar al profesor." });
  }
});

app.all("/profesores", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// Endpoint para iniciar sesión
app.post("/alumnos/:id/session/login", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Obtener la contraseña almacenada en la base de datos
  const alumno = await prisma.alumno.findUnique({
    where: { id: parseInt(id) },
  });

  if (!alumno) {
    return res.status(404).json({ error: "Alumno no encontrado" });
  }

  // Comparar la contraseña proporcionada con la almacenada en la base de datos
  if (password === alumno.password) {
    // Crear una entrada en la tabla sesiones-alumnos
    const sessionString = getRandomString(128);
    const currentDate = Math.floor(Date.now() / 1000); // Fecha actual en Unix timestamp

    const params = {
      TableName: tableName,
      Item: {
        id: uuidv4(),
        fecha: currentDate,
        alumnoId: parseInt(id),
        active: true,
        sessionString: sessionString,
      },
    };

    try {
      await dynamoDB.put(params).promise();
      res.json({ sessionString });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  } else {
    res.status(400).json({ error: "Contraseña incorrecta" });
  }
});

// Función para generar un string aleatorio de longitud dada
function getRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Endpoint para verificar sesión
app.post("/alumnos/:id/session/verify", async (req, res) => {
  const { id } = req.params;
  const { sessionString } = req.body;

  // Obtener la sesión de la tabla sesiones-alumnos
  const params = {
    TableName: tableName,
    FilterExpression: "id = :id AND sessionString = :sessionString",
    ExpressionAttributeValues: {
      ":id": id,
      ":sessionString": sessionString,
    },
  };

  try {
    const result = await dynamoDB.scan(params).promise();

    if (result.Items.length > 0 && result.Items[0].active) {
      res.status(200).json({ message: "Sesión válida" });
    } else {
      res.status(400).json({ error: "Sesión no válida" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al verificar sesión" });
  }
});

// Endpoint para cerrar sesión
app.post("/alumnos/:id/session/logout", async (req, res) => {
  const { id } = req.params;
  const { sessionString } = req.body;

  // Verificar si la sesión es válida y activa
  const sessionParams = {
    TableName: "sesiones-alumnos",
    Key: {
      id: sessionString,
    },
  };

  try {
    const sessionResult = await dynamoDB.get(sessionParams).promise();

    if (!sessionResult.Item || !sessionResult.Item.active) {
      res.status(400).json({ error: "Sesión no válida o inactiva" });
      return;
    }

    // Actualizar el valor de active en la tabla sesiones-alumnos
    const updateParams = {
      TableName: "sesiones-alumnos",
      Key: {
        id: sessionString,
      },
      UpdateExpression: "SET active = :active",
      ExpressionAttributeValues: {
        ":active": false,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updateResult = await dynamoDB.update(updateParams).promise();

    // Verificar si la actualización fue exitosa
    if (updateResult.Attributes && updateResult.Attributes.active === false) {
      res.status(200).json({ message: "Sesión cerrada exitosamente" });
    } else {
      res.status(400).json({ error: "Error al cerrar la sesión" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cerrar la sesión" });
  }
});

app.on("close", () => {
  prisma.$disconnect();
});

// INICIACIÓN DE SERVIDOR
const PORT = 8000;

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la aplicación!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado en http://127.0.0.1:${PORT}`);
});
