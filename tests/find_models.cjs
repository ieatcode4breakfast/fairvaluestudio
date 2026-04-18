async function findModels() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        const geminiModels = data.data
            .filter(m => m.id.toLowerCase().includes('gemini'))
            .map(m => ({id: m.id, name: m.name}));
        console.log('All Gemini models:', JSON.stringify(geminiModels, null, 2));
    } catch (e) {
        console.error(e);
    }
}
findModels().catch(console.error);
