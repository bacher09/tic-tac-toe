from tornado.web import RequestHandler, Application
from tornado.websocket import WebSocketHandler
import tornado.ioloop
from collections import defaultdict
import time
import os.path


ROOT_PATH = os.path.dirname(__file__)


class MainHandler(RequestHandler):

    def get(self):
        self.write("Hello world")


class RoomIsFull(Exception):
    pass


class GamePair(object):

    def __init__(self):
        self.connections = []

    def add(self, con):
        if len(self.connections) < 2:
            self.connections.append(con)
        else:
            raise RoomIsFull()

    def remove(self, con):
        self.connections.remove(con)

    def communicate(self, con, message):
        if not self.full():
            return

        for c in self.connections:
            if c != con:
                c.write_message(message)

    def __len__(self):
        return len(self.connections)

    def full(self):
        return len(self.connections) == 2


class Connections(object):

    def __init__(self):
        self.dct = defaultdict(GamePair)

    def add_connection(self, con):
        self.dct[con.id].add(con)

    def remove_connection(self, con):
        self.dct[con.id].remove(con)

    def communicate(self, con, message):
        print("communicate")
        self.dct[con.id].communicate(con, message)


class MessageHandler(WebSocketHandler):

    def open(self, id):
        self.id = id
        print("open %s" % id)
        try:
            self.game_connections.add_connection(self)
        except RoomIsFull:
            print("exception")
            self.write_message({"server": "full"})
            self.close()
        else:
            self.game_connections.communicate(self, {"server": "connected"})

    def on_message(self, message):
        # validate message
        print(message)
        self.game_connections.communicate(self, message)

    def on_close(self):
        self.game_connections.communicate(self, {"server": "closed"})
        self.game_connections.remove_connection(self)

    @property
    def game_connections(self):
        return self.application.game_connections


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
        self.game_connections = Connections()
        super(Application, self).__init__(handlers, **settings)


def main():
    application = Application()
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
