import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    from .model_service import StudentPerformanceService
except ImportError:
    from model_service import StudentPerformanceService


service = StudentPerformanceService()


class ApiHandler(BaseHTTPRequestHandler):
    server_version = "StudySignalBackend/1.0"

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        path = urlparse(self.path).path
        routes = {
            "/api/health": service.health,
            "/api/models": service.model_options,
            "/api/dashboard/overview": service.overview,
            "/api/dashboard/performance-distribution": service.distribution,
            "/api/dashboard/feature-analysis": service.feature_analysis,
            "/api/dashboard/model-comparison": service.model_comparison,
        }
        handler = routes.get(path)
        if handler is None:
            self.send_json(404, {"detail": "Endpoint not found."})
            return
        self.send_json(200, handler())

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/api/predict":
            self.send_json(404, {"detail": "Endpoint not found."})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(content_length))
            result = service.predict(payload)
        except json.JSONDecodeError:
            self.send_json(400, {"detail": "Request body must be valid JSON."})
        except (TypeError, ValueError, KeyError) as error:
            self.send_json(400, {"detail": str(error)})
        except Exception:
            self.send_json(500, {"detail": "The prediction could not be completed."})
        else:
            self.send_json(200, result)

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")


def run(host="0.0.0.0", port=8000):
    server = ThreadingHTTPServer((host, port), ApiHandler)
    print(f"StudySignal backend listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
