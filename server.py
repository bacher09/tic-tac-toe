from tornado.web import RequestHandler, Application
from tornado.websocket import WebSocketHandler
import tornado.ioloop
import time
import os.path


ROOT_PATH = os.path.dirname(__file__)


class MainHandler(RequestHandler):

    def get(self):
        self.write("Hello world")


class MessageHandler(WebSocketHandler):

    def open(self, id):
        print(self.request.remote_ip)
        print(id)
        print("Open")

    def on_message(self, message):
        print(message)

    def on_close(self):
        print("close")


class Application(Application):

    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/socket/(\d{1,9})", MessageHandler),
        ]
        settings = dict(
            template_path=os.path.join(ROOT_PATH, "templates"),
            static_path=os.path.join(ROOT_PATH, "static"),
            xsrf_cookies=True,
            cookie_secret="11oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            autoescape=True
        )
        super(Application, self).__init__(handlers, **settings)


def main():
    application = Application()
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
