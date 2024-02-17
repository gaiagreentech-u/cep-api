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
            for (let i=0; i<cep.length; i++)
            {
                if (Number(cep_to_search) >= Number(cep[i].inicial) &&  Number(cep_to_search) <= Number(cep[i].final)) {
                    found_cep = true
                }
            }
            
            if (found_cep){
                return {'message': 'CEP encontrado com sucesso.'}
            } else {
                return {'message': 'CEP não encontrado.'}
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

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then (() => {
    console.log('HTTP server running...')
})