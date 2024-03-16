import { PrismaClient } from '@prisma/client'
import fastify, { FastifyReply, FastifyRequest } from 'fastify'
import {z} from 'zod'
import PDFDocument from 'pdfkit';
import { Base64Encode } from 'base64-stream'
import fs from 'fs'
const app = fastify()

const prisma = new PrismaClient()

app.delete('/cep/:id', async (request, reply) => {
    const id = get_parameter_from_request_url(request);

    const query_cep = { where: { id: id } }
    
    const find_cep = await prisma.cep.findUnique(query_cep)
    
    if (find_cep) {
        const result = await prisma.cep.delete({
            where: {
              id: id,
            },
        })
        return reply.status(204).send({result})
    } else {
        return reply.status(422).send({'message': 'id não encontrado: ' + id})
    }
})

app.delete('/ceps', async (request, reply) => {
    await prisma.cep.deleteMany()
    return reply.status(204).send()
})

/*
Post calling with body:
{
    "nome_doador": "Marcelo",
    "cpf_doador": "000.000.000-00",
    "lista_itens": "Fone de ouvido, notebook, celular e geladeira.",
    "peso_estimado": "18.5",
    "numero_pedido": "3242353456433",
    "assinatura": "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"
}
*/

app.post('/pdf', async (request, reply) => {
    let { allowed_access, user_agent } = allowedAccess(request);
    console.log(String(request.headers['user-agent']))
    if (allowed_access) {
        const termoSchema = z.object({
            nome_doador: z.string(),
            cpf_doador: z.string(),
            lista_itens: z.string(),
            peso_estimado: z.string(),
            numero_pedido: z.string(),
            assinatura: z.string()
        })
        try {
            let {nome_doador, cpf_doador, lista_itens, peso_estimado, numero_pedido, assinatura} = termoSchema.parse(request.body)
            const data_hora_termo = dateTimeNowFormattedIso8601()
            const termo = await persistTermoData(nome_doador, cpf_doador, lista_itens, peso_estimado, numero_pedido, assinatura, data_hora_termo)
            
            cpf_doador = blind_cpf(cpf_doador)
            generateFileTermoPDF(numero_pedido, lista_itens, peso_estimado, nome_doador, cpf_doador, assinatura);
            return reply.status(201).send(termo)
        } catch (error: any) {
            if (error instanceof z.ZodError){
                return reply.status(400).send({'message': error.issues})
            } else {
                return reply.status(400).send({'message': error.message})
            }       
        }
    }
})


app.get('/jpg/:pedido', async (request, reply) => { 
    var pedido = get_parameter_from_request_url(request); 
    pedido = `/data/${pedido}.jpg` 

    try {
        var stats = fs.statSync(pedido)
    
        fs.readFile(pedido, (err, fileBuffer) => {
            reply.send(err || fileBuffer)
        })
    
        return reply
        .header('Content-Type', 'image/jpeg')
        .header('content-length', stats.size )
    } catch (error) {
        return reply.status(400).send(error)
    }
})

app.get('/pedido/:pedido', async (request, reply) => { 
    var pedido = get_parameter_from_request_url(request); 
    pedido = `/data/${pedido}.pdf` 

    let { allowed_access, user_agent } = allowedAccess(request);
    
    if (allowed_access) {
        try {
            var stats = fs.statSync(pedido)
    
            fs.readFile(pedido, (err, fileBuffer) => {
                reply.send(err || fileBuffer)
            })
        
            return reply
            .header('Content-Type', 'application/pdf')
            .header('content-length', stats.size )
        } catch (error) {
            return reply.status(400).send(error)
        }
    } else {
        return reply.status(401).send({'message': `Unauthorized ${user_agent}`})
    }
})

app.get('/cep', async (request, reply) => {

    try {
        const cep = await prisma.cep.findMany()
    
        const req_url_array = request.url.split('?')
    
        if (req_url_array.length == 1) {
            return {cep} // list all ceps
        } else {
    
            const req_query_array = req_url_array[1].split('=')
    
            if (req_query_array.length == 0){
                // explicit id
                const id = req_url_array[1]
                const result = await prisma.cep.findUnique({
                    where: {
                      id: id,
                    },
                  })
                return reply.status(200).send({result})
            } else {
                const cep_to_search = req_query_array[1].replace('-','')
                if(cep_to_search.trim() === '') {
                    return {'message': ''}
                }
                else {
                    let found_cep = false
                    let found_regiao = ''
                    for (let i=0; i<cep.length; i++)
                    {
                        if (Number(cep_to_search) >= Number(cep[i].inicial) &&  Number(cep_to_search) <= Number(cep[i].final)) {
                            found_regiao = cep[i].descricao
                            found_cep = true
                            break
                        }
                    }
                    
                    if (found_cep){
                        console.log(`Found ${cep_to_search}`)
                        return reply.status(200).send({'message': 'Estamos disponíveis em sua cidade: ' + found_regiao})
                    } else {
                        console.log(`NOT Found ${cep_to_search}`)
                        return reply.status(200).send({'message': 'Ainda não chegamos na sua cidade. Estamos trabalhando para levar a GAIA para todo o Brasil. Você pode nos ajudar a acelerar nossa revolução, nos indicando para sua marca de eletroeletrônicos favorita.'})
                    }
                }
            } 
        }
    } catch (error) {
        return reply.status(400).send(error)
    }
})

app.get('/cep/:id', async (request) => {
    const id = get_parameter_from_request_url(request);

    const result = await prisma.cep.findUniqueOrThrow({
        where: {
          id: id,
        },
      })
      console.log(request.url)
    return {result}
})

app.post('/cep', async (request, reply) => {
    let { allowed_access, user_agent } = allowedAccess(request);
    console.log(String(request.headers['user-agent']))
    if (allowed_access) {
        const createCepSchema = z.object({
            inicial: z.string(),
            final: z.string(), 
            descricao: z.string(),
        })
        try {
            const {inicial, final, descricao} = createCepSchema.parse(request.body)
            const cep = await prisma.cep.create({
                data: {
                    inicial,
                    final,
                    descricao,
                }
            })
            return reply.status(201).send(cep)
        } catch (error) {
            if (error instanceof z.ZodError){
                return reply.status(400).send(error.issues)
            }
        }
    } else {
        return reply.status(401).send({'message': `Unauthorized ${user_agent}`})
    }
})

app.put('/cep', async (request, reply) => {
    const createCepSchema = z.object({
        id: z.string(),
        inicial: z.string(),
        final: z.string(), 
        descricao: z.string(),
    })
    const {id, inicial, final, descricao} = createCepSchema.parse(request.body)

    const findRecord = await prisma.cep.findUnique({
        where: {
          id: id,
        },
      })

    if (findRecord) {
        const updateCep = await prisma.cep.update({
            where: {
                id: id
            },
            data: {
                inicial,
                final,
                descricao,
            }
        })
        return reply.status(200).send(updateCep)
    } else {
        return reply.status(422).send({'message': 'id não encontrado: ' + id})
    }
})

app.post('/ceps', async (request, reply) => {
    const createCepSchema = z.object({
        inicial: z.string(),
        final: z.string(), 
        descricao: z.string(),
    })
    
    const data = [
        ['4999999','4000000','Zona Sul de São Paulo'],
        ['6889999','6750001','Taboão da Serra, Embu das Artes, Itapecerica da Serra'],
        ['8939999','8600001','Suzano, Mogi das Cruzes, Guararema'],
        ['18146999','18000001','Sorocaba, Votorantim, Mairinque, Alumínio, São Roque'],
        ['1599999','1000000','Centro de São Paulo'],
        ['13199999','13170001','Sumaré, Hortolândia, Monte Mor'],
        ['6999999','6890000','São Lourenço Da Serra, Embu-Guaçu, Juquitiba'],
        ['9399999','9000001','Santo André, Mauá'],
        ['8499999','8000000','São Paulo Zona Leste 2'],
        ['6699999','6550000','Pirapora do Bom Jesus, Itapevi, Jandira'],
        ['7699999','7500000','Santa Isabel, Mairiporã'],
        ['3999999','3000000','Zona Leste de São Paulo'],
        ['9999999','9500001','São Caetano do Sul, São Bernardo do Campo, Diadema'],
        ['2999999','2000000','Zona Norte de São Paulo'],
        ['5899999','5000000','Zona Oeste de São Paulo'],
        ['9499999','9400001','Ribeirão Pires, Rio Grande da Serra'],
        ['18179999','18160000','Salto de Pirapora, Piedade'],
        ['18185000','18185000','Pilar do Sul'],
        ['13464999','13380001','Nova Odessa, Rio das Pedras, Piracicaba, Santa Bárbara d´Oeste'],
        ['13513154','13480001','Limeira, Cordeirópolis, Rio Claro'],
        ['6299999','6000001','Osasco'],
        ['13856999','13800001','Mogi Mirim, Holambra, Mogi Guaçu'],
        ['12349999','12300001','Jacarei'],
        ['13577999','13530000','Itirapina, Ipeúna, São Carlos'],
        ['18549999','18500000','Laranjal Paulista, Cerquilho, Tietê, Porto Feliz'],
        ['7499999','7000001','Guarulhos, Arujá'],
        ['8599999','8500001','Ferraz de Vasconcelos, Poã, Itaquaquecetuba'],
        ['13379999','13350000','Elias Fausto, Capivari, Rafard e Mombuca'],
        ['6749999','6700000','Cotia, Vargem Grande Paulista'],
        ['13349999','13200001','Cidades Divisas com Jundiaí'],
        ['13159999','13000001','Campinas, Paulínia'],
        ['12916399','12916399','Bragança Paulista'],
        ['12910110','12910110','Bragança Paulista'],
        ['12922820','12922820','Bragança Paulista'],
        ['6549999','6300001','Carapicuíba, Barueri, Santana de Parnaíba'],
        ['12922190','12922190','Bragança Paulista'],
        ['7999999','7700001','Caieiras, Cajamar, Franco da Rocha,  Francisco Morato'],
        ['18569999','18550001','Boituva, Iperó'],
        ['12904160','12904160','Bragança Paulista'],
        ['18159999','18147000','Araçariguama, Ibiúna'],
        ['12999999','12955000','Bom Jesus dos Perdões, Nazaré Paulista, Piracaia, Joanópolis, Pinhalzinho'],
        ['18289999','18190000','Araçoiaba da Serra, Capela do Alto, Tatuí, Cesário Lange'],
        ['13169999','13160001','Artur Nogueira'],
        ['13624999','13600001','Araras, Leme'],
        ['12954999','12940001','Atibaia'],
        ['13479999','13465001','Americana'],
        ['13929999','13900001','Amparo, Jaguariúna, Pedreira'],
        ['13479999','13465001','Americana']  
    ]

    for (let i=0; i<data.length; i++){
        const final = data[i][0]
        const inicial = data[i][1]
        const descricao = data[i][2]

        await prisma.cep.create({
            data: {
                inicial,
                final,
                descricao,
            }
        })    
    }

    return reply.status(201).send()
})

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then (() => {
    console.log('HTTP server running...')
})

async function persistTermoData(nome_doador: string, cpf_doador: string, lista_itens: string, peso_estimado: string, numero_pedido: string, assinatura: string, data_hora_termo: string) {
    return await prisma.termo.create({
        data: {
            nome_doador,
            cpf_doador,
            lista_itens,
            peso_estimado,
            numero_pedido,
            assinatura,
            data_hora_termo
        }
    });
}

function generateResponseTermoPDF(numero_pedido: string, 
                            lista_itens: string, 
                            peso_estimado: string, 
                            nome_doador: string, 
                            cpf_doador: string, 
                            assinatura: string,
                            reply: FastifyReply) {

    const doc = getDocPDFTermo(numero_pedido, lista_itens, peso_estimado, nome_doador, cpf_doador, assinatura);
    doc.pipe(reply.raw);
    doc.end();
}

function generateFileTermoPDF(numero_pedido: string, 
                            lista_itens: string, 
                            peso_estimado: string, 
                            nome_doador: string, 
                            cpf_doador: string, 
                            assinatura: string) {

    const doc = getDocPDFTermo(numero_pedido, lista_itens, peso_estimado, nome_doador, cpf_doador, assinatura);
    doc.pipe(fs.createWriteStream(`/data/${numero_pedido}.pdf`));
    doc.end();
}

function getDocPDFTermo(numero_pedido: string, lista_itens: string, peso_estimado: string, nome_doador: string, cpf_doador: string, assinatura: string) {
    const doc = new PDFDocument();
    const titulo = 'TERMO DE DOAÇÃO DE ELETROELETRÔNICO';
    const body = `Como Usuário(a) que decidiu contribuir com o objetivo da GAIA de promover a destinação sustentável para eletroeletrônicos em desuso, declaro descartar meus eletroeletrônicos em desuso, incentivando os processos de Reciclagem apoiados pela GAIA, para ajudar a evitar o acúmulo de lixo tóxico no planeta e o esgotamento dos recursos naturais. \n\n` +
        `Por meio deste Termo de Doação de Eletroeletrônico (“Termo”), transmito de livre e espontânea vontade, de forma gratuita e sem quaisquer ônus à Coletas Para Economia Circular LTDA, inscrita no CNPJ no. 49.840.854/0001-75 a propriedade, posse e o domínio que eu exercia sobre o(s) seguinte(s) bem(ns) eletrônico(s) que se encontra(m) em desuso, do(s) qual(is) sou legítimo possuidor e proprietário (“Doação”):` +
        `\n\nPedido: ${numero_pedido}\n${lista_itens}\nPeso estimado: ${peso_estimado} kg\n(“Objeto(s) Doado(s)”)` +
        `\n\nTambém declaro que estou de acordo com a destinação sustentável que será dada ao Objeto Doado pela GAIA, que será para reciclagem na recicladora parceira Indústria Fox Economia Circular LTDA, inscrita no CNPJ: no. 10.804.529/0001-11 em acordo com a Política Nacional de Resíduos Sólidos (PNRS) – Lei 12.305/10.` +
        `\n\nAo realizar a Doação, declaro ter removido todo e qualquer dado pessoal possível de exclusão do Objeto Doado, seja pela remoção de chip, cartão de memória, ou outros, bem como declaro ter feito todo o possível para resetar o Objeto Doado a partir da restauração ao padrão de fábrica, não o tendo resetado apenas em caso de eletrônicos com defeitos que impossibilitem a conclusão desta ação.` +
        `\n\nDeclaro ainda, que forneci meus dados pessoais para realização da Doação, bem como para comunicação e execução deste Termo, os quais serão tratados de acordo com a Lei Geral de Proteção de Dados Pessoais, Lei n.º 13.709, de 14 de agosto de 2018 (“LGPD”), e demais leis aplicáveis à proteção de dados, sendo garantido o uso exclusivo, armazenamento e/ou compartilhamento dos dados apenas para o cumprimento das referidas finalidades.` +
        `\n\nEste Termo entrará em vigor, para todos os fins de direito, na data do seu aceite e permanecerá válido por prazo indeterminado.` +
        `\n\nO presente Termo não cria qualquer outro vínculo do Usuário(a) com a GAIA, responsabilidade ou obrigação, além daqueles aqui contraídos. Nenhuma disposição do Termo deverá ser entendida como relação de parceria ou qualquer tipo de associação entre a GAIA e o Usuário(a) e não outorga à GAIA qualquer poder de representação, mandato, agência ou comissão.` +
        `\n\nE, assim, consinto com o presente Termo.`;

    const doador = `\nDoador: ${nome_doador}   CPF: ${cpf_doador}\n`;

    doc.text(titulo, 100, 80);
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`${body}`, {
        width: 440,
        align: 'left'
    });
    doc.fontSize(12);
    doc.text(`${doador}`);

    // Scale proprotionally to the specified width
    doc.image(`data:image/png;base64,${assinatura}`, { width: 220 });
    doc.text(dateTimeNowFormatted(), {
        width: 440,
        align: 'right'
    });
    return doc;
}

function allowedAccess(request: FastifyRequest) {
    let user_agent = String(request.headers['user-agent']);
    let allowed_agents = ['PostmanRuntime/7.36.3', 'Bubble',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'];
    let allowed_access = allowed_agents.indexOf(user_agent) > -1;
    return { allowed_access, user_agent };
}

function dateTimeNowFormatted() {
    let { date, month, year, hh, mm, ss } = getDateTimeNow();

    return `${date}-${month}-${year} ${hh}:${mm}:${ss}`;
}

function dateTimeNowFormattedIso8601() {
    let { date, month, year, hh, mm, ss } = getDateTimeNow();

    return `${year}-${month}-${date}T${hh}:${mm}:${ss}.000Z`;
}

function getDateTimeNow() {
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate().toString().padStart(2, '0');
    let month = (date_ob.getMonth() + 1).toString().padStart(2, '0');
    let year = date_ob.getFullYear();

    let hh = date_ob.getHours().toString().padStart(2, '0');
    let mm = date_ob.getMinutes().toString().padStart(2, '0');
    let ss = date_ob.getSeconds().toString().padStart(2, '0');
    return { date, month, year, hh, mm, ss };
}

function get_parameter_from_request_url(request: FastifyRequest) {
    const req_url_array = request.url.split('/');
    const id = req_url_array[req_url_array.length - 1];
    return id;
}

class MalformedCPF extends Error {
    constructor(args: string | undefined) {
      super(args);
      this.name = 'MalformedCPF';
    }
}

/****
  Receives a cpf (only numbers or like xxx.xxx.xxx-xx) and returns ***.xxx.xxx-**
****/ 
function blind_cpf(cpf: string) {
    
    if (cpf.indexOf('.') === -1) {
      if (cpf.length !== 11) {
        throw new MalformedCPF(`CPF inválido: ${cpf}`);
      }
      cpf = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    }
    
    if (cpf.length != 14) {
      throw new MalformedCPF(`CPF inválido: ${cpf}`);
    }

    return `***.${cpf.slice(4, 7)}.${cpf.slice(8, 11)}-**`;
}
