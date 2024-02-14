-- CreateTable
CREATE TABLE "Cep" (
    "id" TEXT NOT NULL,
    "inicial" TEXT NOT NULL,
    "final" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cep_pkey" PRIMARY KEY ("id")
);
