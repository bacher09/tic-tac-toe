from tornado.web import RequestHandler, Application
from tornado.options import define, options, parse_command_line
from tornado.websocket import WebSocketHandler
import tornado.ioloop
from collections import defaultdict
import time
import os.path


define("port", default=8888, help="run on the given port", type=int)
define("debug", default=False, help="set tornado to debug mode", type=bool)
ROOT_PATH = os.path.dirname(__file__)


class MainHandler(RequestHandler):

    def get(self):
        self.render("index.html")


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

    def broadcast(self, message):
        for c in self.connections:
            c.write_message(message)

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

    @property
    def first(self):
        return self.connections[0] if self.full() else None

    @property
    def second(self):
        return self.connections[1] if self.full() else None


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

    def __getitem__(self, item):
        return self.dct[item]


# server messages
# type: full
# type: newplayer
# type: gamestart, val: whom
# type: playerexit
# type: message, val: message_text
# type: move, x: x_cord, y: y_cord

# client messages
# type: message, val: message_text
# type: move, x: x_cord, y: y_cord

class MessageHandler(WebSocketHandler):

    def open(self, id):
        self.id = id
        print("open %s" % id)
        try:
            self.game_connections.add_connection(self)
        except RoomIsFull:
            self.write_message({"type": "full"})
            self.close()
        else:
            self.game_pair = self.game_connections[id]
            self.game_pair.communicate(self, {"type": "newplayer"})
            if self.game_pair.full():
                print("game start")
                self.game_pair.first.write_message({"type": "gamestart", "val": 1})
                self.game_pair.second.write_message({"type": "gamestart", "val": 2})

    def on_message(self, message):
        # validate message
        self.game_connections.communicate(self, message)

    def on_close(self):
        self.game_connections.communicate(self, {"type": "playerexit"})
        self.game_connections.remove_connection(self)

    @property
    def game_connections(self):
        return self.application.game_connections


class Application(Application):

    def __init__(self, **kwargs):
        handlers = [
            (r"/", MainHandler),
            (r"/socket/(\d{1,9})", MessageHandler),
        ]
        settings = dict(
            template_path=os.path.join(ROOT_PATH, "templates"),
            static_path=os.path.join(ROOT_PATH, "static"),
            xsrf_cookies=True,
            cookie_secret="11oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo="
        )

        settings.update(kwargs)
        self.game_connections = Connections()
        super(Application, self).__init__(handlers, **settings)


def main():
    parse_command_line()
    application = Application(debug=options.debug)
    application.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
