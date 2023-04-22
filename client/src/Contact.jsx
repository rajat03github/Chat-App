import React from "react";
import Avatar from "./Avatar";

export default function Contact({ id, username, onClick, selected, online }) {
  return (
    <div
      key={id}
      onClick={() => onClick(id)} // select contact on click
      // onClick={() => onclick(id)}
      className={
        "border-b border-gray-100  flex items-center gap-2 cursor-pointer " +
        (selected ? "bg-blue-200" : "")
      }>
      {selected && <div className="w-1 bg-blue-400 h-9 rounded-r-md"></div>}
      <div className="flex gap-2 py-2 pl-4 items-center">
        <Avatar online={online} userId={id} username={username} />
        <span className="text-gray-800">{username}</span>
      </div>
    </div>
  );
}
