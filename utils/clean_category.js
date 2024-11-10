const { categoriesAndSubcategories } = require("../test.js");

function cleanCategoriesAndSubcategories(data) {
  const cleanedData = {};

  for (let category in data) {
    const subcategories = data[category].map((sub) => {
      // For "laptop & tablet" category
      if (category === "laptop & tablet") {
        if (
          sub.includes("accessories") ||
          sub.includes("accessory") ||
          sub.includes("keyboard") ||
          sub.includes("mouse") ||
          sub.includes("charger") ||
          sub.includes("cable")
        ) {
          return "laptop accessories";
        } else if (sub.includes("laptop")) {
          return "laptop";
        }
      }

      // For "components" category
      if (category === "components") {
        if (sub.includes("dvd") || sub.includes("writer")) {
          return "dvd";
        } else if (sub.includes("graphics card") || sub.includes("gpu")) {
          return "graphics card";
        } else if (sub.includes("fan") || sub.includes("casing-fan")) {
          return "casing fan";
        } else if (sub.includes("led")) {
          return "rgb led strip";
        } else if (
          sub.includes("case") ||
          sub.includes("casing") ||
          sub.includes("tower") ||
          sub.includes("mesh")
        ) {
          return "computer case";
        } else if (sub.includes("cool")) {
          return "cooling";
        } else if (sub.includes("hdd") || sub.includes("hard disk")) {
          return "hard disk drive";
        } else if (sub.includes("ssd") || sub.includes("solid state")) {
          return "solid state drive";
        } else if (
          sub.includes("mount") ||
          sub.includes("mounting") ||
          sub.includes("bracket")
        ) {
          return "mounting bracket";
        }
      }
      //   For accessories
      if (category === "accessories") {
        if (sub.includes("mouse")) {
          return "mouse";
        } else if (sub.includes("keyboard")) {
          return "keyboard";
        } else if (sub.includes("charger") || sub.includes("adapter")) {
          return "charger";
        } else if (
          sub.includes("cable") ||
          sub.includes("wire") ||
          sub.includes("cord") ||
          sub.includes("strip")
        ) {
          return "cable";
        } else if (sub.includes("power bank")) {
          return "power bank";
        } else if (sub.includes("sound card")) {
          return "sound card";
        } else if (
          sub.includes("headphone") ||
          sub.includes("headphones") ||
          sub.includes("earphone") ||
          sub.includes("earphones") ||
          sub.includes("headset")
        ) {
          return "headphone";
        } else if (
          sub.includes("speaker") ||
          sub.includes("soundbar") ||
          sub.includes("sound bar")
        ) {
          return "speaker";
        } else if (sub.includes("microphone")) {
          return "microphone";
        } else if (sub.includes("webcam")) {
          return "webcam";
        } else if (sub.includes("switch")) {
          return "switch";
        } else if (sub.includes("converter")) {
          return "converter";
        } else if (
          sub.includes("micro sd") ||
          sub.includes("sd card") ||
          sub.includes("memory card") ||
          sub.includes("card reader")
        ) {
          return "sd card";
        } else if (sub.includes("tv card")) {
          return "tv card";
        } else if (sub.includes("battery")) {
          return "battery";
        } else if (sub.includes("ethernet")) {
          return "network cable";
        } else if (
          sub.includes("rest pad") ||
          sub.includes("mouse pad") ||
          sub.includes("wrist rest") ||
          sub.includes("wrist pad")
        ) {
          return "wrist pad";
        } else if (
          sub.includes("splitters") ||
          sub.includes("splitter") ||
          sub.includes("hub")
        ) {
          return "hub & splitter";
        } else if (sub.includes("watch") || sub.includes("smartwatch")) {
          return "smartwatch";
        } else if (
          sub.includes("gaming combo") ||
          sub.includes("combo") ||
          sub.includes("3-in-1")
        ) {
          return "gaming combo";
        } else if (
          sub.includes("lighting") ||
          sub.includes("light") ||
          sub.includes("led") ||
          sub.includes("lamp") ||
          sub.includes("hue") ||
          sub.includes("icue")
        ) {
          return "lighting";
        } else if (
          sub.includes("stand") ||
          sub.includes("paste") ||
          sub.includes("holder") ||
          sub.includes("enclosure") ||
          sub.includes("receiver") ||
          sub.includes("thermal") ||
          sub.includes("pencil") ||
          sub.includes("dvd") ||
          sub.includes("driver") ||
          sub.includes("radio") ||
          sub.includes("hard drive") ||
          sub.includes("protector") ||
          sub.includes("gimbal") ||
          sub.includes("tools") ||
          sub.includes("wifi")
        ) {
          return "others";
        }
      }

      // For office equipment
      if (category === "office equipment") {
        if (sub.includes("pabx")) {
          return "ip phone";
        } else if (
          sub.includes("fake note detector") ||
          sub.includes("fake note ") ||
          sub.includes("detector")
        ) {
          return "fake note detector";
        } else if (
          sub.includes("projector") ||
          sub.includes("projectors") ||
          sub.includes("screen")
        ) {
          return "projector";
        } else if (sub.includes("printer")) {
          return "printer";
        } else if (
          sub.includes("barcode") ||
          sub.includes("scanner") ||
          sub.includes("barcode scanner")
        ) {
          return "barcode scanner";
        } else if (
          sub.includes("toner") ||
          sub.includes("cartridge") ||
          sub.includes("toner & cartridge") ||
          sub.includes("ink") ||
          sub.includes("ribbon")
        ) {
          return "toner & cartridge";
        } else if (
          sub.includes("binding") ||
          sub.includes("machine") ||
          sub.includes("pedestal")
        ) {
          return "other";
        }
      }
      return sub;
    });

    // Remove duplicates
    cleanedData[category] = [...new Set(subcategories)];
  }

  return cleanedData;
}

// Example usage:
const cleanedCategories = cleanCategoriesAndSubcategories(
  categoriesAndSubcategories
);

console.log(cleanedCategories);

// Export the function if you need to use it elsewhere
module.exports = { cleanCategoriesAndSubcategories };
