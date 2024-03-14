-- CreateTable
CREATE TABLE "Termo" (
    "id" TEXT NOT NULL,
    "nome_doador" TEXT NOT NULL,
    "cpf_doador" TEXT NOT NULL,
    "lista_itens" TEXT NOT NULL,
    "peso_estimado" TEXT NOT NULL,
    "numero_pedido" TEXT NOT NULL,
    "assinatura" TEXT NOT NULL,
    "data_hora_termo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Termo_pkey" PRIMARY KEY ("id")
);
