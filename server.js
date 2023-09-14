require("dotenv").config();
const fs = require("fs/promises");
const fss = require("fs");
const express = require("express");
const path = require("path");
const app = express();

// const productFile = "./resource/products.json";
const productFile = path.resolve("resource", "products.json");
// console.log(productFile);
const deletedFile = path.resolve("resource", "deleted.json");

// ==============================
// create function for readfile
// const getProducts = () => fs.readFile(productFile, "utf8").then(raw => JSON.parse(raw))
// readFile will come as String and use parse to make it to be object but please remind all these is a Promises!!
// ย่อๆ
const getProducts = () => fs.readFile(productFile, "utf8").then(JSON.parse);
const getDeleted = () => fs.readFile(deletedFile, "utf8").then(JSON.parse);
// getProducts() ===> return Promise Object
// ===============================
// create function for write file
const saveFile = (file, data) =>
  fs.writeFile(file, JSON.stringify(data, null, 2));

// check deleted file is exit? มีอยู่มั้ย=>ถ้าไม่มีให้สร้างไฟล์ที่มี data เป็น []
if (!fss.existsSync(deletedFile)) {
  saveFile(deletedFile, []);
}

// function for read del and push del data
const saveToDeleted = (del_item) => {
  getDeleted().then((all_del) => {
    all_del.push(del_item);
    return saveFile(deletedFile, all_del);
  });
};
// ข้อ1
// app.get("/products", (req, res) => {
//   let { _page = 1, _limit = 10 } = req.query;
//   // this method don't prevent zero or minus value
//   getProducts().then((all) => {
//     let start = (_page - 1) * _limit;
//     let end = start + +_limit;
//     let output = all.slice(start, end);
//     res.json({ start, end, output });
//   });
// });

// ข้อ1+3
app.get("/products", (req, res) => {
  let { _page = 1, _limit = 10, _min = 0, _max = 999_999 } = req.query;
  // this method don't prevent zero or minus value
  getProducts().then((all) => {
    let productFilter =
      _min !== 0 && _max !== 999_999
        ? all.filter((el) => el.price > +_min && el.price < +_max)
        : all;
    let start = (_page - 1) * _limit;
    let end = start + +_limit;
    let output = productFilter.slice(start, end);
    res.json({ allitem: productFilter.length, output });
  });
});

// ข้อ2
app.delete("/product/:id", (req, res) => {
  const { id } = req.params;
  getProducts().then((all) => {
    let del_idx = all.findIndex((el) => el.id === +id);
    // prevent if can't find id
    if (del_idx === -1) return res.status(404).json({ msg: "Data not found" });
    let [del_item] = all.splice(del_idx, 1);
    saveFile(productFile, all);
    // saveFile(deletedFile, del_item);
    saveToDeleted(del_item);
    res.json({ msg: `Deleted id =${id}` });
  });
});

// ป้องกันการ มั่ว url ต้องเป็น middleware สุดท้ายเสมอ เพราะ use หมายถึงทุกๆ method
// แต่หากจำเป็นต้องไปทำ middleware ตัวถัดไปด้วย จะต้องใช้ next
app.use((req, res, next) => {
  res.status(404).json({ msg: "Path not found" });
  next();
});

let port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
