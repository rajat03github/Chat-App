import React from "react";
//imported with react-icons
import { IoLogoSnapchat } from "react-icons/io";

export default function Logo() {
  return (
    <div className="text-blue-700 font-bold flex gap-1 text-xl antialiased tracking-wide  p-4 ">
      <div className=" text-blue-700 flex px-1 my-1 content-normal">
        <IoLogoSnapchat />
      </div>
      Chat~Wave
    </div>
  );
}
