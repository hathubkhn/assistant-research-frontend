# Research Assistant Frontend

This is the frontend for the Research Assistant application, which integrates with the backend API to provide a user interface for querying research papers and getting AI-generated answers.

## Integration with Backend

The frontend communicates with the backend through API routes that proxy requests to the backend server. The main API routes are:

- `/api/research-assistant/query` - For querying the research assistant
- `/api/research-assistant/papers` - For adding or deleting papers

## Configuration

To configure the frontend to connect to the backend, set the following environment variable:

```bash
# In your .env file
RESEARCH_ASSISTANT_API_URL=http://localhost:8000
```

If not specified, it will default to `http://localhost:8000`.

## Features

1. **Query Interface**: Users can enter natural language questions about research topics
2. **Response Display**: Shows AI-generated answers based on the retrieved papers
3. **Source Attribution**: Displays the source papers used to generate the answer
4. **Relevance Scoring**: Shows how relevant each paper is to the query

## How It Works

1. The user enters a query in the search box
2. The frontend sends the query to the Next.js API route
3. The API route forwards the request to the backend Research Assistant API
4. The backend retrieves relevant papers from Qdrant vector database
5. The backend generates an answer using OpenAI based on the retrieved papers
6. The response is returned to the frontend and displayed to the user

## Components

- **Search Form**: Allows users to enter queries
- **Answer Section**: Displays the AI-generated answer
- **Sources Section**: Shows the papers used to generate the answer, including titles, abstracts, and keywords

## Getting Started

1. Ensure the backend Research Assistant is running
2. Set the `RESEARCH_ASSISTANT_API_URL` environment variable
3. Start the Next.js development server:

```bash
npm run dev
```

4. Navigate to the Research Assistant page in your browser 