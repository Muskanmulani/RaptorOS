const {
  createEmbedding,
  cosineSimilarity
} = require("./embeddingService");

const evidenceStore = new Map();

const chunkText = (text, chunkSize = 500) => {
  const normalized = String(text || "").trim();

  if (!normalized) {
    return [];
  }

  const words = normalized.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
};

const indexProjectEvidence = ({
  projectId,
  projectTitle,
  description,
  readme,
  techStack
}) => {
  const documents = [
    {
      source: "project_description",
      text: description || ""
    },
    {
      source: "project_readme",
      text: readme || ""
    },
    {
      source: "tech_stack",
      text: Array.isArray(techStack)
        ? techStack.join(", ")
        : techStack || ""
    }
  ];

  const chunks = [];

  for (const document of documents) {
    const documentChunks = chunkText(document.text);

    documentChunks.forEach((text, index) => {
      chunks.push({
        id: `${projectId}-${document.source}-${index + 1}`,
        projectId,
        projectTitle,
        source: document.source,
        text,
        embedding: createEmbedding(text)
      });
    });
  }

  evidenceStore.set(projectId, chunks);

  return {
    projectId,
    chunkCount: chunks.length
  };
};

const retrieveEvidence = ({
  projectId,
  query,
  limit = 5
}) => {
  const chunks = evidenceStore.get(projectId) || [];

  if (chunks.length === 0) {
    return [];
  }

  const queryEmbedding = createEmbedding(query);

  return chunks
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(
        queryEmbedding,
        chunk.embedding
      )
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((chunk) => ({
      id: chunk.id,
      source: chunk.source,
      text: chunk.text,
      similarity: Number(chunk.similarity.toFixed(4))
    }));
};

const clearProjectEvidence = (projectId) => {
  evidenceStore.delete(projectId);
};

module.exports = {
  indexProjectEvidence,
  retrieveEvidence,
  clearProjectEvidence
};