
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

/* ==========================================================
   4. ENVIAR IMAGEM DO QUADRINHO

   Executada durante a publicação de um quadrinho.

   Responsabilidades:
   - Identificar a imagem selecionada.
   - Validar o formato e o tamanho do arquivo.
   - Gerar um nome único para evitar substituições.
   - Enviar a imagem ao Supabase Storage.
   - Retornar a URL pública da imagem.
========================================================== */

async function enviarImagemQuadrinho() {

    const campoImagem =
        document.getElementById("quadrinho-imagem");

    const arquivo = campoImagem?.files?.[0];

    if (!arquivo) {
        throw new Error("Selecione uma imagem para o quadrinho.");
    }

    const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
    };

    if (!extensoes[arquivo.type]) {
        throw new Error(
            "Utilize uma imagem JPG, PNG, WEBP ou GIF."
        );
    }

    const tamanhoMaximo = 10 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
        throw new Error(
            "A imagem deve ter no máximo 10 MB."
        );
    }

    const nomeArquivo =
        `${crypto.randomUUID()}.${extensoes[arquivo.type]}`;

    const { error } = await supabase.storage
        .from("imagens-quadrinhos")
        .upload(nomeArquivo, arquivo, {
            contentType: arquivo.type,
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from("imagens-quadrinhos")
        .getPublicUrl(nomeArquivo);

    return data.publicUrl;
}


/* ==========================================================
   5. PUBLICAR QUADRINHO

   Executada quando o editor envia o formulário.

   Responsabilidades:
   - Validar os campos obrigatórios.
   - Confirmar a sessão do usuário.
   - Enviar a imagem ao Supabase Storage.
   - Cadastrar o quadrinho no banco de dados.
   - Informar o resultado da publicação.
   - Limpar o formulário após o sucesso.
========================================================== */

async function publicarQuadrinho(evento) {

    evento.preventDefault();

    const textoOriginal = botaoPublicar?.textContent;

    try {
        const quadrinho = coletarDadosQuadrinho();

        validarQuadrinho(quadrinho);

        const { data: usuario, error: erroUsuario } =
            await supabase.auth.getUser();

        if (erroUsuario || !usuario.user) {
            throw new Error(
                "Sua sessão expirou. Faça login novamente."
            );
        }

        if (botaoPublicar) {
            botaoPublicar.disabled = true;
            botaoPublicar.textContent = "PUBLICANDO...";
        }

        quadrinho.imagem_url =
            await enviarImagemQuadrinho();

        const { error } = await supabase
            .from("quadrinhos")
            .insert({
                ...quadrinho,
                criado_por: usuario.user.id,
                atualizado_por: usuario.user.id
            });

        if (error) {
            throw error;
        }

        window.alert("Quadrinho publicado com sucesso!");

        formulario.reset();

    } catch (erro) {

        console.error(
            "[OZZY] Erro ao publicar quadrinho:",
            erro
        );

        window.alert(
            "Não foi possível publicar o quadrinho: " +
            erro.message
        );

    } finally {

        if (botaoPublicar) {
            botaoPublicar.disabled = false;
            botaoPublicar.textContent = textoOriginal;
        }
    }
}


/* ==========================================================
   6. INICIALIZAR PUBLICAÇÃO

   Executada quando o módulo é carregado.

   Responsabilidade:
   - Conectar o formulário à função de publicação.
========================================================== */

formulario?.addEventListener(
    "submit",
    publicarQuadrinho
);

