import Replicate from "replicate";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function checkModel() {
    try {
        console.log("Checking google/nano-banana...");
        // Попробуем получить информацию о модели
        const model = await replicate.models.get("google", "nano-banana");
        console.log("Model found:", model);

        // Попробуем узнать последнюю версию и её схему
        const latestVersion = model.latest_version;
        console.log("Inputs supported:", latestVersion.openapi_schema.components.schemas.Input.properties);

    } catch (e) {
        console.error("Error checking model:", e.message);
    }
}

checkModel();
