const express = require("express");
const app = express();

app.use(express.json());

const alumnos = [];
const profesores = [];

// Función para generar un ID único
const generarIdUnico = () => {
  return Math.random().toString(36).substr(2, 9);
};

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
app.get("/alumnos", (req, res) => {
  res.json(alumnos);
});

app.get("/alumnos/:id", (req, res) => {
  const alumno = alumnos.find((a) => a.id === req.params.id);
  if (!alumno) return res.status(404).json({ error: "Alumno no encontrado." });
  res.json(alumno);
});

app.post("/alumnos", validarCampos, validarTipoDeDato, (req, res) => {
  const { nombres, apellidos, matricula, promedio } = req.body;
  const id = generarIdUnico();

  if (!nombres || !apellidos || !matricula || !promedio) {
    return res.status(400).json({ error: "Ningún campo puede estar vacío." });
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
});

app.put("/alumnos/:id", validarTipoDeDato, (req, res) => {
  const index = alumnos.findIndex((a) => a.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Alumno no encontrado." });
  alumnos[index] = { ...alumnos[index], ...req.body };
  res.json(alumnos[index]);
});

app.delete("/alumnos/:id", (req, res) => {
  const index = alumnos.findIndex((a) => a.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Alumno no encontrado." });
  alumnos.splice(index, 1);
  res.sendStatus(200);
});

// Profesores
app.get("/profesores", (req, res) => {
  res.json(profesores);
});

app.get("/profesores/:id", (req, res) => {
  const profesor = profesores.find((p) => p.id === req.params.id);
  if (!profesor)
    return res.status(404).json({ error: "Profesor no encontrado." });
  res.json(profesor);
});

// POST /profesores
app.post("/profesores", validarCampos, validarTipoDeDato, (req, res) => {
  const { numeroEmpleado, nombres, apellidos, horasClase } = req.body;
  const id = generarIdUnico();

  if (!numeroEmpleado || !nombres || !apellidos || !horasClase) {
    return res.status(400).json({ error: "Ningún campo puede estar vacío." });
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
});

app.put("/profesores/:id", validarTipoDeDato, (req, res) => {
  const index = profesores.findIndex((p) => p.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Profesor no encontrado." });
  profesores[index] = { ...profesores[index], ...req.body };
  res.json(profesores[index]);
});

app.delete("/profesores/:id", (req, res) => {
  const index = profesores.findIndex((p) => p.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Profesor no encontrado." });
  profesores.splice(index, 1);
  res.sendStatus(200);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor iniciado en http://localhost:${port}`);
});
