
/* ==========================================================
   JORNAL OZZY — GERENCIAMENTO DE QUADRINHOS

   Responsabilidades:
   - Ler os dados do formulário editorial.
   - Validar os campos obrigatórios.
   - Preparar o cadastro de quadrinhos no Supabase.
   - Gerenciar imagens e publicações nas próximas etapas.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* ==========================================================
   1. CONFIGURAÇÃO DO SUPABASE

   Estabelece a conexão com o projeto Jornal Ozzy
   utilizando a chave pública.
========================================================== */

const SUPABASE_URL =
    "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const formulario =
    document.getElementById("form-quadrinho");

const botaoPublicar =
    document.getElementById("quadrinho-publicar");


/* ==========================================================
   2. COLETAR DADOS DO QUADRINHO

   Executada durante a preparação da publicação.

   Responsabilidades:
   - Ler os campos do formulário.
   - Converter os valores para o formato do banco.
   - Identificar a seleção de destaque.
========================================================== */

function coletarDadosQuadrinho() {

    const valor = (id) =>
        document.getElementById(id)?.value.trim() || "";

    return {
        titulo: valor("quadrinho-titulo"),
        data_publicacao: valor("quadrinho-data"),
        edicao: valor("quadrinho-edicao") || null,
        imagem_url: null,
        descricao: valor("quadrinho-descricao") || null,
        destaque:
            document.getElementById("quadrinho-destaque")
                ?.checked || false
    };
}


/* ==========================================================
   3. VALIDAR QUADRINHO

   Executada antes do envio ao Supabase.

   Responsabilidades:
   - Exigir título e data de publicação.
   - Verificar se uma imagem foi selecionada.
   - Informar campos obrigatórios ausentes.
========================================================== */

function validarQuadrinho(quadrinho) {

    if (!quadrinho.titulo) {
        throw new Error("Informe o título do quadrinho.");
    }

    if (!quadrinho.data_publicacao) {
        throw new Error("Informe a data de publicação.");
    }

    const arquivo =
        document.getElementById("quadrinho-imagem")
            ?.files?.[0];

    if (!arquivo) {
        throw new Error("Selecione a imagem do quadrinho.");
    }

    return true;
}
