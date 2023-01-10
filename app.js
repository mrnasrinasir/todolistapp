//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
require("dotenv").config();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_DB_URL);

const itemsSchema = ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items :[itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Sucessfully saved default items to database")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  //parse data from list in list.ejs
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
// if list name is equal to today(default route), save item and redirect back to home
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    // find the listname which was parsed from const listName and push it to foundList array
      List.findOne({name:listName}, function(err,foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName

  if (listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted the checked item");
        res.redirect("/");
}
});

} else {
  List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
    if (!err) {
      res.redirect("/" + listName);
    }
});
}
});

app.get("/:customListName", function(req,res){

const customListName = _.capitalize(req.params.customListName);

List.findOne({name:customListName}, function(err,foundList){
  if (!err){
    if(!foundList){
      //Create a new list
      const list = new List({
        name:customListName,
        items:defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      //Show existing list

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});
});


app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,() => {
  console.log("Server running on port ${port}");
});
