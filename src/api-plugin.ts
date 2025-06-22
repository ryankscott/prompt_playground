import { Plugin } from "vite";
import { POST as chatHandler } from "./api/chat/route";

export default function apiPlugin(): Plugin {
  return {
    name: "api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Handle API requests
        if (req.url?.startsWith("/api/chat")) {
          try {
            // Convert Express request to standard Request
            const url = new URL(req.url, `http://${req.headers.host}`);
            const headers = new Headers();

            for (const [key, value] of Object.entries(req.headers)) {
              if (value) {
                headers.set(
                  key,
                  Array.isArray(value) ? value.join(", ") : value.toString()
                );
              }
            }

            // Read body
            let body = "";
            await new Promise((resolve) => {
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", () => {
                resolve(null);
              });
            });

            const request = new Request(url, {
              method: req.method,
              headers,
              body: body || null,
            });

            // Pass to route handler
            const response = await chatHandler(request);

            // Set status code
            res.statusCode = response.status;

            // Set headers
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            // Stream response
            if (response.body) {
              const reader = response.body.getReader();

              // Process the stream
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
            }

            res.end();
          } catch (error: unknown) {
            console.error("API middleware error:", error);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error:
                  error instanceof Error
                    ? error.message
                    : "Internal Server Error",
              })
            );
          }
          return;
        }

        next();
      });
    },
  };
}
