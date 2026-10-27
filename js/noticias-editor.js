/* ==========================================================
   JORNAL OZZY — GERENCIAMENTO DE NOTÍCIAS

   Responsabilidades:
   - Coletar informações do formulário.
   - Validar os campos obrigatórios.
   - Salvar notícias no Supabase.
   - Informar o resultado da publicação.

   Upload de imagens será implementado separadamente.
========================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


/* ==========================================================
   1. CONFIGURAÇÃO DO SUPABASE

   Estabelece a conexão com o banco de dados utilizando
   exclusivamente a chave pública do projeto.
========================================================== */

const SUPABASE_URL = "https://djcbfumizeojyiifecik.supabase.co";

const SUPABASE_KEY = "sb_publishable_Z-NFJxfxXl53L0DbejvmOQ_1q-_ZVc_";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const formulario = document.getElementById("form-noticia");
const botaoPublicar = document.getElementById("noticia-publicar");


/* ==========================================================
   2. LEITURA DOS CAMPOS

   Executada quando o editor solicita uma publicação.

   Responsabilidade:
   - Reunir as informações do formulário.
   - Converter os campos para a estrutura do banco.
========================================================== */

function coletarDadosNoticia() {
    const valor = (id) =>
        document.getElementById(id)?.value.trim() || "";

    return {
        titulo: valor("noticia-titulo"),
        subtitulo: valor("noticia-subtitulo") || null,
        categoria: valor("noticia-categoria"),
        autor: valor("noticia-autor") || null,
        data_publicacao: valor("noticia-data"),
        hora_publicacao: valor("noticia-hora"),
        imagem_url: null,
        imagem_legenda: valor("noticia-legenda") || null,
        conteudo: valor("noticia-conteudo"),
        citacao: valor("noticia-citacao") || null,
        citacao_autor: valor("noticia-citacao-autor") || null,
        origem: valor("noticia-origem") || null,
        setor: valor("noticia-setor") || null,
        destaque: document.getElementById("noticia-destaque")?.checked || false
    };
}


/* ==========================================================
   3. VALIDAÇÃO DA NOTÍCIA

   Executada antes do envio ao Supabase.

   Responsabilidade:
   - Impedir publicações sem informações obrigatórias.

   Retorno:
   - true: notícia válida.
   - false: existem campos obrigatórios vazios.
========================================================== */

function validarNoticia(noticia) {
    if (
        !noticia.titulo ||
        !noticia.categoria ||
        !noticia.data_publicacao ||
        !noticia.hora_publicacao ||
        !noticia.conteudo
    ) {
        alert("Preencha os campos obrigatórios da notícia.");
        return false;
    }

    return true;
}

/* ==========================================================
   UPLOAD DE IMAGEM DA NOTÍCIA

   Executada durante a publicação, quando o editor
   seleciona uma imagem no formulário.

   Responsabilidades:
   - Verificar se uma imagem foi selecionada.
   - Validar o formato e o tamanho do arquivo.
   - Enviar a imagem ao Supabase Storage.
   - Retornar o endereço público da imagem.

   Se não houver imagem, retorna null.
========================================================== */

async function enviarImagemNoticia() {

    const campoImagem = document.getElementById("noticia-imagem");
    const arquivo = campoImagem?.files?.[0];

    if (!arquivo) {
        return null;
    }

    const formatosPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
        throw new Error("Utilize uma imagem JPG, PNG ou WEBP.");
    }

    const tamanhoMaximo = 5 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
        throw new Error("A imagem deve ter no máximo 5 MB.");
    }

    const extensoes = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
    };

    const nomeArquivo = `${crypto.randomUUID()}.${extensoes[arquivo.type]}`;

    const { error } = await supabase.storage
        .from("imagens-noticias")
        .upload(nomeArquivo, arquivo, {
            contentType: arquivo.type,
            upsert: false
        });

    if (error) {
        throw error;
    }

    const { data } = supabase.storage
        .from("imagens-noticias")
        .getPublicUrl(nomeArquivo);

    return data.publicUrl;
}

/* ==========================================================
   4. PUBLICAÇÃO DA NOTÍCIA

   Executada quando o editor envia o formulário.

   Responsabilidades:
   - Impedir o envio tradicional da página.
   - Validar a sessão do usuário.
   - Validar os dados preenchidos.
   - Inserir a notícia no Supabase.
   - Informar o resultado ao editor.
========================================================== */

async function publicarNoticia(evento) {
    evento.preventDefault();

    const noticia = coletarDadosNoticia();

    if (!validarNoticia(noticia)) {
        return;
    }

    botaoPublicar.disabled = true;
    botaoPublicar.textContent = "PUBLICANDO...";

    try {
        const { data: usuario, error: erroUsuario } =
            await supabase.auth.getUser();

        if (erroUsuario || !usuario.user) {
            throw new Error("Sessão editorial inválida.");
        }

        const { error } = await supabase
            .from("noticias")
            .insert({
                ...noticia,
                criado_por: usuario.user.id
            });

        if (error) {
            throw error;
        }

        alert("Notícia publicada com sucesso!");

        formulario.reset();

    } catch (erro) {
        console.error("Erro ao publicar notícia:", erro);

        alert(
            "Não foi possível publicar a notícia: " +
            erro.message
        );

    } finally {
        botaoPublicar.disabled = false;
        botaoPublicar.textContent = "PUBLICAR";
    }
}


/* ==========================================================
   5. INICIALIZAÇÃO DO FORMULÁRIO

   Registra a função de publicação no formulário HTML.

   Responsabilidade:
   - Executar publicarNoticia quando o editor
     clicar no botão PUBLICAR.
========================================================== */

formulario?.addEventListener("submit", publicarNoticia);

