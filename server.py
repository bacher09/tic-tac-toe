from tornado.web import RequestHandler, Application
from tornado.options import define, options, parse_command_line
from tornado.websocket import WebSocketHandler
import tornado.ioloop
from collections import defaultdict
import json
import os.path


define("port", default=8888, help="run on the given port", type=int)
define("debug", default=False, help="set tornado to debug mode", type=bool)
ROOT_PATH = os.path.dirname(__file__)


class MainHandler(RequestHandler):

    def get(self):
        self.render("index.html")


class RoomIsFull(Exception):
    pass


class Room(object):

    X_USER = 1
    O_USER = 2

    def __init__(self):
        self.connections = []

    def __len__(self):
        return len(self.connections)

    def add(self, con):
        if len(self) < 2:
            self.connections.append(con)
        else:
            raise RoomIsFull("")

    def broadcast(self, message):
        for c in self.connections:
            c.write_message(message)

    def comunicate(self, con):
        for c in self.connections:
            if c != con:
                c.write_message(message)

    def other(self, con):
        if not self.full:
            raise ValueError("Other not exists")

        for c in self.connections:
            if c != con:
                return c

    def game_start(self):
        if not self.full:
            raise ValueError("Room is not full")

        f_type = self.random_choice()
        s_type = self.another_user(f_type)
        self.first.send_gamestart(f_type)
        self.second.send_gamestart(s_type)


    @staticmethod
    def random_choice():
        import random
        return random.randrange(1, 3)

    @classmethod
    def another_user(cls, user_type):
        if user_type == cls.X_USER:
            return cls.O_USER 
        elif user_type == cls.O_USER:
            return cls.X_USER
        else:
            raise ValueError("Bad user type")

    @property
    def full(self):
        return len(self) == 2

    @property
    def first(self):
        return self.connections[0] if self.full else None

    @property
    def second(self):
        return self.connections[1] if self.full else None


class GameService(object):

    def __init__(self):
        self.rooms = {}

    def __getitem__(self, key):
        return self.rooms[key]

    def get(self, key, default=None):
        return self.rooms.get(key, default)

    def join_room(self, con, room_id):
        room = self.rooms.get(room_id)
        if room is None:
            room = Room()
            self.rooms[room_id] = room

        try:
            room.add(con)
        except RoomIsFull:
            con.send_full()
        else:
            con.on_roomjoined(room_id)
            if room.full:
                room.game_start()
            else:
                con.send_wait()

    def close_room(self, con, room_id):
        room = self.rooms.get(room_id)
        if room is None:
            return

        if room.full:
            room.other(con).send_end()
        del self.rooms[room_id]


# server messages
# type: full
# type: joined, id: room_id
# type: wait
# type: end
# type: gamestart, val: whom
# type: move, x: x_cord, y: y_cord

# client messages
# type: joinany
# type: joinroom, id: room_id
# type: move, x: x_cord, y: y_cord

class MessageHandler(WebSocketHandler):
    
    room_id = None

    def open(self):
        pass

    def on_message(self, message):
        message_json = json.loads(message)
        # TODO: validate schema

        print(message)
        type_m = message_json.get("type")
        if type_m == "joinroom":
            self.on_roomexit()
            self.games.join_room(self, message_json["id"])
        elif type_m == "move":
            if self.room is None:
                # game not start
                return

    def on_roomexit(self):
        if self.room is not None:
            self.games.close_room(self, self.room_id)
            

    def on_close(self):
        self.on_roomexit()

    def on_roomjoined(self, room_id):
        self.room_id = room_id
        self.send_joined(room_id)

    def send_gamestart(self, val):
        self.write_message({"type": "gamestart", "val": val})

    def send_full(self):
        self.write_message({"type": "full"})

    def send_wait(self):
        self.write_message({"type": "wait"})

    def send_joined(self, room_id):
        self.write_message({"type": "joined", "id": room_id})

    def send_end(self, con):
        self.write_message({"type": "end"})

    @property
    def games(self):
        return self.application.game_service

    @property
    def room(self):
        return None if self.room_id is None else self.games.get(self.room_id)


class Application(Application):

    def __init__(self, **kwargs):
        handlers = [
            (r"/", MainHandler),
            (r"/socket", MessageHandler),
        ]
        settings = dict(
            template_path=os.path.join(ROOT_PATH, "templates"),
            static_path=os.path.join(ROOT_PATH, "static"),
            xsrf_cookies=True,
            cookie_secret="11oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo="
        )

        settings.update(kwargs)
        self.game_service = GameService()
        super(Application, self).__init__(handlers, **settings)


def main():
    parse_command_line()
    application = Application(debug=options.debug)
    application.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
