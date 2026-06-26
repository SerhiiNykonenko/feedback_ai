import http from "node:http";

http
  .createServer((request, response) => {
    const proxyRequest = http.request(
      {
        hostname: "host.docker.internal",
        port: 3000,
        path: request.url,
        method: request.method,
        headers: request.headers
      },
      (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
      }
    );

    proxyRequest.on("error", () => {
      response.writeHead(502);
      response.end("Local application proxy failed");
    });
    request.pipe(proxyRequest);
  })
  .listen(3000, "127.0.0.1");
