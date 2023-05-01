import React from "react";

export default function Avatar({ userId, username, online }) {
  // Colors for specific avatars
  const colors = [
    "bg-red-300",
    "bg-fuchsia-400",
    "bg-teal-200",
    "bg-purple-400",
    "bg-cyan-300",
    "bg-green-300",
    "bg-amber-200",
    "bg-indigo-500",
    "bg-yellow-200",
  ];
  // console.log(userId);
  // ?  Changing the Id in Base10
  const userIdBase10 = parseInt(userId, 16);

  //   ifUseriD = 15 % 6 = 3(third colour will be chosen);
  const colorIndex = userIdBase10 % colors.length;
  const color = colors[colorIndex];

  return (
    <div
      className={"w-8 h-8 relative rounded-full  flex items-center " + color}>
      <div className="text-center w-full opacity-70">{username[0]}</div>
      {online && (
        <div className="absolute w-2.5 h-2.5 bg-green-600 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black"></div>
      )}
      {!online && (
        <div className="absolute w-2.5 h-2.5 bg-gray-200 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black"></div>
      )}
    </div>
  );
}
