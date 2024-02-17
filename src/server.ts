import { PrismaClient } from '@prisma/client'
import fastify from 'fastify'
import {z} from 'zod'

const app = fastify()

const prisma = new PrismaClient()

app.delete('/cep', async (request, reply) => {
    await prisma.cep.deleteMany()
    return reply.status(204).send()
})

app.get('/cep', async (request) => {
    const cep = await prisma.cep.findMany()

    const req_url_array = request.url.split('?')

    if (req_url_array.length == 1) {
        return {cep} // list all ceps
    } else {
        const cep_to_search = req_url_array[1].split('=')[1].replace('-','')

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
})

app.post('/cep', async (request, reply) => {
    const createCepSchema = z.object({
        inicial: z.string(),
        final: z.string(), 
        descricao: z.string(),
    })
    const {inicial, final, descricao} = createCepSchema.parse(request.body)

    await prisma.cep.create({
        data: {
            inicial,
            final,
            descricao,
        }
    })
    return reply.status(201).send()
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
        ['1599999','1000000','São Paulo Centro'],
        ['13199999','13170001','Sumaré, Hortolândia, Monte Mor'],
        ['6999999','6890000','São Lourenço Da Serra, Embu-guaçu, Juquitiba'],
        ['9399999','9000001','Santo André, Mauá'],
        ['8499999','8000000','São Paulo Zona Leste 2'],
        ['6699999','6550000','Pirapora do Bom Jesus, Itapevi, Jandira'],
        ['7699999','7500000','Santa Isabel, Mairiporã'],
        ['3999999','3000000','São Paulo Zona Leste'],
        ['9999999','9500001','São Caetano do Sul, S. Bernardo Do Campo, Diadema'],
        ['2999999','2000000','São Paulo Zona Norte'],
        ['5899999','5000000','São Paulo Zona Oeste'],
        ['9499999','9400001','Ribeirão Pires, Rio Grande da Serra'],
        ['18179999','18160000','Salto de Pirapora, Piedade'],
        ['18185000','18185000','Pilar do Sul'],
        ['13464999','13380001','Nova Odessa, Rio das Pedras, Piracicaba, Santa Bárbara d´Oeste'],
        ['13513154','13480001','Limeira, Cordeirópolis, Rio Claro'],
        ['6299999','6000001','Osasco'],
        ['13856999','13800001','Mogi Mirim, Holambra, Mogi Guaçu'],
        ['12349999','12300001','Jacarei'],
        ['13577999','13530000','Itirapina, Ipeuna, São Carlos'],
        ['18549999','18500000','Laranjal Paulista, Cerquilho, Tietê, Porto Feliz'],
        ['77090002','77090002','Pedido Interno'],
        ['7499999','7000001','Guarulhos, Aruja'],
        ['8599999','8500001','Ferraz de Vasconcelos, Poã, Itaquaquecetuba'],
        ['13379999','13350000','Elias Fausto, Capivari, Rafard e Mombuca'],
        ['6749999','6700000','Cotia, Vargem Grande Paulista'],
        ['13349999','13200001','Cidades Divisas com Jundiaí'],
        ['13159999','13000001','Campinas, Paulínia'],
        ['12916399','12916399','Bragança Paulista'],
        ['12910110','12910110','Bragança Paulista'],
        ['12922820','12922820','Bragança Paulista'],
        ['6549999','6300001','Carapicuiba, Barueri, Santana de Parnaiba'],
        ['12922190','12922190','Bragança Paulista'],
        ['7999999','7700001','Caieiras, Cajamar, Franco da Rocha,  Francisco Morato'],
        ['18569999','18550001','Boituva, Ipero'],
        ['12904160','12904160','Bragança Paulista'],
        ['18159999','18147000','Aracariguama, Ibiuna'],
        ['12999999','12955000','Bom Jesus dos Perdões, Nazaré Paulista, Piracaia, Joanópolis, Pinhalzinho'],
        ['18289999','18190000','Araçoiaba da Serra, Capela do  Alto, Tatui, Cesário Lange'],
        ['13169999','13160001','Artur Nogueira'],
        ['13624999','13600001','Araras, Leme'],
        ['12954999','12940001','Atibaia'],
        ['13479999','13465001','Americana'],
        ['13929999','13900001','Amparo, Jaguariuna, Pedreira'],
        ['13465001','13479999','Americana']  
    ]

    for (let i=0; i<data.length; i++){
        const inicial = data[i][0]
        const final = data[i][1]
        const descricao = data[i][2]

        await prisma.cep.create({
            data: {
                inicial,
                final,
                descricao,
            }
        })    }

    return reply.status(201).send()
})


app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then (() => {
    console.log('HTTP server running...')
})