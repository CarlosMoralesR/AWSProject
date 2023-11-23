-- CreateTable
CREATE TABLE "Alumno" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "promedio" DOUBLE PRECISION NOT NULL,
    "fotoPerfilUrl" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profesor" (
    "id" SERIAL NOT NULL,
    "numeroEmpleado" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "horasClase" INTEGER NOT NULL,

    CONSTRAINT "Profesor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Alumno_matricula_key" ON "Alumno"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Profesor_numeroEmpleado_key" ON "Profesor"("numeroEmpleado");
