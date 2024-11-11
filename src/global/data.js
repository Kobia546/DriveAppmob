export const filterData = [ {name:"Parking",image: require('../../assets/Wavy_Bus-42_Single-05.jpg'), id:"0"},
    {name:"Services",image:require("../../assets/food.png"),id:"1"},
//     {name:"Package",image:require("../../assets/package.png"),id:"2"},
    {name:"Conciergeries",image:require("../../assets/reserve.png"),id:"2"}
  
   ];


export const rideData =[
{street:"Yopougon",area:"Millionaire",id:"0"},
{street:"Treichville",area:"Gare de Bassam",id:"1"},
{street:"Assinie",area:" Mafia",id:"2"},
{street:"Cocody Danga",area:"35 Atlas Rd,Anderbolt,Boksburg",id:"3"},
{street:"179 8th Ave",area:"Bezuidenhout Valley,Johannesburg",id:"4"},
];

export const carTypeData =[
{title:"Popular",
data:[
{name:"Uber Go",group :2, price:7,image: require('../../assets/uberGo.png'),note:"Affordable.compact rides",promotion:5 ,time:"20:19",id:"0"},
{name:"UberX",group :3, price:5.5,image: require('../../assets/uberX.png'),note:"Affordable everyday trips",promotion:0,time:"20:20", id:"1"},
{name:"Connect", group:0, price:12.6,image: require('../../assets/uberConnect.png'),note:"Send and receive packages",promotion:10,time:"20:33", id:"2"}
]
},

{title:"Premium",
data:[
{name:"Black",group :3, price:17.4,image: require('../../assets/uberBlack.png'),note:"Premium trips in luxury cars",promotion:0,time:"20:31",id:"3"},
{name:"Van", group:6, price:22.3,image: require('../../assets/uberVan.png'),note:"Rides for groups up to 6",promotion:12,time:"20:31", id:"4"},
]
},

{title:"More",
data:[
{name:"Assist",group :3, price:35.3,image: require('../../assets/uberAssist.png'),note:"Special assistance from certified drivers",promotion:26,time:"20:25",id:"5"},
]
},

];

export const requestData = [{
name:"For Me",id:0
},
{
name:"For Someone",id:1
}

]

export const rideOptions = [{name:"Personal",icon:"account", id:"0"},
{name:"Business",icon:"briefcase", id:"1"},  

];

export const paymentOptions = [{image:require('../../assets/visaIcon.png'),text:"Visa ...0476"},
        {image:require('../../assets/cashIcon.png'),text:"Cash"}]

export const availableServices = ["Uber Go","UberX","Uber connect","Uber Black","Uber Van","Uber Assist"]

export const carsAround = [
        {latitude: 5.309197, longitude: -4.023015}, // Point 1
        {latitude: 5.308970, longitude: -4.025356}, // Point 2
        {latitude: 5.307872, longitude: -4.024578}, // Point 3
        {latitude: 5.310134, longitude: -4.022823}, // Point 4
        {latitude: 5.311123, longitude: -4.021671}, // Point 5
    ];
    