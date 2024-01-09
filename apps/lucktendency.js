import lodash from "lodash";
const _path = process.cwd();
let PokeCD = {};

    let PictureNum = 6;

    let CD = 6000;//1s=1000ms


export const rule = {
  运势: {
    reg: "运势$",
    priority: 100,
    describe: "",
  }
};
export async function 运势(e){
    if(!e.isMaster){
      if(PokeCD[e.group_id])
        return true;
      else SetPokeCD(e);
    }
      console.log("Poke-图片");
      let msg = [];
      let img = `file:///${_path}/plugins/liulian-plugin/resources/expression/运势/${lodash.random(1, PictureNum)}.jpg`;
      msg.unshift(segment.image(img));
      e.reply(msg);
    return true;
  }
function SetPokeCD(e){
    if (e.isPoke) {
      PokeCD[e.group_id] = 1;
      setTimeout(() => {
        delete PokeCD[e.group_id];
      }, CD);
      return;
    }
}