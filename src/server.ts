import { PrismaClient } from '@prisma/client'
import fastify, { FastifyRequest } from 'fastify'
import {z} from 'zod'
import PDFDocument from 'pdfkit';
import { Base64Encode } from 'base64-stream'
import fs from 'fs'
const app = fastify()

const prisma = new PrismaClient()

app.delete('/cep/:id', async (request, reply) => {
    const id = get_id_from_request_url(request);

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

app.post('/pdf', async (request, reply) => {
    
    const termoSchema = z.object({
        nome_doador: z.string(),
        cpf_doador: z.string(),
        lista_itens: z.string(),
        peso_estimado: z.string(),
        numero_pedido: z.string(),
    })

    try {
        console.log(request.body)
        const {nome_doador, cpf_doador, lista_itens, peso_estimado, numero_pedido} = termoSchema.parse(request.body)

        const doc = new PDFDocument()
        const titulo = 'TERMO DE DOAÇÃO DE ELETROELETRÔNICO'
        const body = `Como Usuário(a) que decidiu contribuir com o objetivo da GAIA de promover a destinação sustentável para eletroeletrônicos em desuso, declaro descartar meus eletroeletrônicos em desuso, incentivando os processos de Reciclagem apoiados pela GAIA, para ajudar a evitar o acúmulo de lixo tóxico no planeta e o esgotamento dos recursos naturais. \n\n` + 

                        `Por meio deste Termo de Doação de Eletroeletrônico (“Termo”), transmito de livre e espontânea vontade, de forma gratuita e sem quaisquer ônus à Coletas Para Economia Circular LTDA, inscrita no CNPJ no. 49.840.854/0001-75 a propriedade, posse e o domínio que eu exercia sobre o(s) seguinte(s) bem(ns) eletrônico(s) que se encontra(m) em desuso, do(s) qual(is) sou legítimo possuidor e proprietário (“Doação”):\n` +

                        `\n\nPedido: ${numero_pedido}\n${lista_itens}\nPeso estimado: ${peso_estimado} kg\n(“Objeto(s) Doado(s)”)` +

                        `\n\nTambém declaro que estou de acordo com a destinação sustentável que será dada ao Objeto Doado pela GAIA, que será para reciclagem na recicladora parceira Indústria Fox Economia Circular LTDA, inscrita no CNPJ: no. 10.804.529/0001-11 em acordo com a Política Nacional de Resíduos Sólidos (PNRS) – Lei 12.305/10.` +

                        `\n\nAo realizar a Doação, declaro ter removido todo e qualquer dado pessoal possível de exclusão do Objeto Doado, seja pela remoção de chip, cartão de memória, ou outros, bem como declaro ter feito todo o possível para resetar o Objeto Doado a partir da restauração ao padrão de fábrica, não o tendo resetado apenas em caso de eletrônicos com defeitos que impossibilitem a conclusão desta ação.` +

                        `\n\nDeclaro ainda, que forneci meus dados pessoais para realização da Doação, bem como para comunicação e execução deste Termo, os quais serão tratados de acordo com a Lei Geral de Proteção de Dados Pessoais, Lei n.º 13.709, de 14 de agosto de 2018 (“LGPD”), e demais leis aplicáveis à proteção de dados, sendo garantido o uso exclusivo, armazenamento e/ou compartilhamento dos dados apenas para o cumprimento das referidas finalidades.` + 

                        `\n\nEste Termo entrará em vigor, para todos os fins de direito, na data do seu aceite e permanecerá válido por prazo indeterminado.` +

                        `\n\nO presente Termo não cria qualquer outro vínculo do Usuário(a) com a GAIA, responsabilidade ou obrigação, além daqueles aqui contraídos. Nenhuma disposição do Termo deverá ser entendida como relação de parceria ou qualquer tipo de associação entre a GAIA e o Usuário(a) e não outorga à GAIA qualquer poder de representação, mandato, agência ou comissão.` +

                        `\n\nE, assim, consinto com o presente Termo.`

        const doador = `\n\nDoador: ${nome_doador} CPF: ${cpf_doador}` 

        doc.pipe(fs.createWriteStream(`/data/${numero_pedido}.pdf`))
        doc.text(titulo, 100, 80)
    
        // Set the font size
        doc.fontSize(28);
    
        // Using a standard PDF font
        doc.moveDown(0.5);
    
        doc.fontSize(10);
        
        doc.text(`${body}`, {
            width: 440,
            align: 'left'
          }
          );
        doc.fontSize(12)
        doc.text(`${doador}`)
        // Scale proprotionally to the specified width
        doc.image('assinatura.png', {width: 220})
        doc.end()
    } catch (error) {
        if (error instanceof z.ZodError){
            return reply.status(400).send(error.issues)
        }        
    }
})

app.get('/pdf_size', async (request, reply) => {
    var name_file = '/data/3242353456432.pdf'
    var stats = fs.statSync(name_file)
    return {'message': `Tamanho do ${name_file}: ${stats.size} `}
})

app.get('/cep', async (request, reply) => {
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
            
            
            
            console.log(cep_to_search)
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
                    return {'message': 'Estamos disponíveis em sua cidade: ' + found_regiao}
                } else {
                    return {'message': 'Ainda não chegamos na sua cidade. Estamos trabalhando para levar a GAIA para todo o Brasil. Você pode nos ajudar a acelerar nossa revolução, nos indicando para sua marca de eletroeletrônicos favorita.'}
                }
            }
        } 
    }
})

app.get('/cep/:id', async (request) => {
    const id = get_id_from_request_url(request);

    const result = await prisma.cep.findUniqueOrThrow({
        where: {
          id: id,
        },
      })
      console.log(request.url)
    return {result}
})

app.post('/cep', async (request, reply) => {
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

function get_id_from_request_url(request: FastifyRequest) {
    const req_url_array = request.url.split('/');
    const id = req_url_array[req_url_array.length - 1];
    return id;
}
