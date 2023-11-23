const express = require("express");
const app = express();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

app.use(express.json());

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

// Función para validar matrícula única
function validarMatriculaUnica(req, res, next) {
  const { matricula } = req.body;
  if (alumnos.some((alumno) => alumno.matricula === matricula)) {
    return res
      .status(400)
      .json({ error: "Ya existe un alumno con la misma matrícula." });
  }
  next();
}

// EDITAR ALUMNOS
app.put("/alumnos/:id", validarTipoDeDato, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Obtén los campos que se enviaron en la solicitud
    const { nombres, apellidos, matricula, promedio } = req.body;

    // Construye el objeto data solo con los campos que se enviaron
    const data = {};
    if (nombres !== undefined) data.nombres = nombres;
    if (apellidos !== undefined) data.apellidos = apellidos;
    if (matricula !== undefined) data.matricula = matricula;
    if (promedio !== undefined) data.promedio = Number(promedio);

    // Actualiza el alumno solo con los campos proporcionados
    const alumno = await prisma.alumno.update({
      where: { id },
      data,
    });

    res.json(alumno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el alumno." });
  }
});

// ELIMINAR ALUMNOS
app.delete("/alumnos/:id", async (req, res) => {
  const id = parseInt(req.params.id);

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

  try {
    // Obtén los campos que se enviaron en la solicitud
    const { numeroEmpleado, nombres, apellidos, horasClase } = req.body;

    // Construye el objeto data solo con los campos que se enviaron
    const data = {};
    if (numeroEmpleado !== undefined) data.numeroEmpleado = numeroEmpleado;
    if (nombres !== undefined) data.nombres = nombres;
    if (apellidos !== undefined) data.apellidos = apellidos;
    if (horasClase !== undefined) data.horasClase = Number(horasClase);

    // Actualiza el alumno solo con los campos proporcionados
    const profesor = await prisma.profesor.update({
      where: { id },
      data,
    });

    res.json(profesor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el profesor." });
  }
});

// ELIMINAR PROFESORES
app.delete("/profesores/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.profesor.delete({
      where: { id },
    });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el profesor." });
  }
});

app.all("/profesores", (req, res) => {
  res.status(405).send("Method Not Allowed");
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
