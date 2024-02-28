import { PrismaClient } from '@prisma/client'
import fastify, { FastifyRequest } from 'fastify'
import route from 'fastify'
import {z} from 'zod'
import PDFDocument from 'pdfkit';
import fs from  'fs'

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

app.get('/pdf', async (request, res) => {
    const req_url_array = request.url.split('?')

    let name = 'anybody'
    let local = 'world'
    if (req_url_array.length > 1) {
        let request_data = req_url_array[1].split('&') //
        name = decodeURI(request_data[0].split('=')[1])
        local = decodeURI(request_data[1].split('=')[1])
    }

    const doc = new PDFDocument
    const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl. Suspendisse rhoncus nisl posuere tortor tempus et dapibus elit porta. Cras leo neque, elementum a rhoncus ut, vestibulum non nibh. Phasellus pretium justo turpis. Etiam vulputate, odio vitae tincidunt ultricies, eros odio dapibus nisi, ut tincidunt lacus arcu eu elit. Aenean velit erat, vehicula eget lacinia ut, dignissim non tellus. Aliquam nec lacus mi, sed vestibulum nunc. Suspendisse potenti. Curabitur vitae sem turpis. Vestibulum sed neque eget dolor dapibus porttitor at sit amet sem. Fusce a turpis lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;'
    
    doc.path('M 30,280 L 130,400 Q 160,400 180,400 C 220,240 230,360 330,430 L 430,370')
        .stroke( "blue")
    doc.polygon([100, 50], [50, 130], [150, 130]);
    doc.circle(100, 100, 40)
   .lineWidth(3)
   .fillOpacity(0.8)
   .fillAndStroke("red", "#900")
    doc.stroke();
    // doc.pipe(fs.createWriteStream('pdf_file.pdf'))
    doc.pipe(res.raw)
    doc.text(`Hello ${name}!`, 100, 180)

    // Set the font size
    doc.fontSize(24);

    // Using a standard PDF font
    doc.font('Times-Roman')
    .text(`Hello ${name} from ${local}!`)
    .moveDown(0.5);

    doc.fontSize(12);
    
    doc.fillAndStroke("grey", "#900")
    doc.text(`This text is left aligned. ${lorem}`, {
        width: 410,
        align: 'left'
      }
      );
    doc.end()
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

app.patch('/cep', async (request, reply) => {
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
