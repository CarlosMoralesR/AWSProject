const express = require("express");
const app = express();

app.use(express.json());

const alumnos = [];
const profesores = [];

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
app.get("/alumnos", (req, res) => {
  res.status(200).json(alumnos);
});

// GET ALUMNOS POR ID
app.get("/alumnos/:id", (req, res) => {
  const alumno = alumnos.find((a) => a.id == req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  res.json(alumno);
});

// CREAR ALUMNOS
app.post(
  "/alumnos",
  validarCampos,
  validarMatriculaUnica,
  validarTipoDeDato,
  (req, res) => {
    const { id, nombres, apellidos, matricula, promedio } = req.body;

    if (alumnos.some((alumno) => alumno.matricula === matricula)) {
      return res
        .status(400)
        .json({ error: "Ya existe un alumno con la misma matrícula." });
    }

    const alumno = {
      id,
      nombres,
      apellidos,
      matricula,
      promedio: Number(promedio),
    };

    alumnos.push(alumno);
    res.status(201).json(alumno);
  }
);

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
app.put("/alumnos/:id", validarCampos, validarTipoDeDato, (req, res) => {
  const index = alumnos.findIndex((a) => a.id == req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Alumno no encontrado." });
  alumnos[index] = { ...alumnos[index], ...req.body };
  res.json(alumnos[index]);
});

// ELIMINAR ALUMNOS
app.delete("/alumnos/:id", (req, res) => {
  const index = alumnos.findIndex((a) => a.id == req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Alumno no encontrado." });
  alumnos.splice(index, 1);
  res.sendStatus(200);
});

app.all("/alumnos", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// Profesores
// GET PROFESORES
app.get("/profesores", (req, res) => {
  res.status(200).json(profesores);
});

// GET PROFESORES POR ID
app.get("/profesores/:id", (req, res) => {
  const profesor = profesores.find((p) => p.id == req.params.id);
  if (!profesor)
    return res.status(404).json({ error: "Profesor no encontrado." });
  res.json(profesor);
});

// CREAR PROFESORES
app.post(
  "/profesores",
  validarCampos,
  validarNumeroEmpleadoUnico,
  validarTipoDeDato,
  (req, res) => {
    const { id, numeroEmpleado, nombres, apellidos, horasClase } = req.body;

    if (
      profesores.some((profesor) => profesor.numeroEmpleado === numeroEmpleado)
    ) {
      return res.status(400).json({
        error: "Ya existe un profesor con el mismo número de empleado.",
      });
    }

    const profesor = {
      id,
      numeroEmpleado,
      nombres,
      apellidos,
      horasClase: Number(horasClase),
    };

    profesores.push(profesor);
    res.status(201).json(profesor);
  }
);

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
app.put("/profesores/:id", validarCampos, validarTipoDeDato, (req, res) => {
  const index = profesores.findIndex((p) => p.id == req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Profesor no encontrado." });
  profesores[index] = { ...profesores[index], ...req.body };
  res.json(profesores[index]);
});

// ELIMINAR PROFESORES
app.delete("/profesores/:id", (req, res) => {
  const index = profesores.findIndex((p) => p.id == req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Profesor no encontrado." });
  profesores.splice(index, 1);
  res.sendStatus(200);
});

app.all("/profesores", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// INICIACIÓN DE SERVIDOR
const PORT = 8000;

app.get("/", (req, res) => {
  res.send("¡Bienvenido a la aplicación!");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado en http://127.0.0.1:${PORT}`);
});
