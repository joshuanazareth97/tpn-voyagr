import http from "http";

/**
 * Perform an HTTP GET and parse the response as JSON.
 * Rejects on non-2xx status or parse errors.
 */
export async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const { statusCode } = res;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`Request failed. Status Code: ${statusCode}`));
          // consume response data to free up memory
          res.resume();
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}
