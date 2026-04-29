import dotenv from 'dotenv';
import {z} from "zod";

dotenv.config({path: '.env'});
dotenv.config({path: 'local.env', override: false});

const configSchema = z.object({
    PORT: z.number({coerce: true}).default(3000),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
});

export const config = configSchema.parse(process.env);
