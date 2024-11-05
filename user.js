class User {
  constructor(uid, email, username, cars, token) {
    this.uid = uid;
    this.email = email;
    this.username = username;
    this.cars=cars;
   
    this.token = token;
    this.createdAt = new Date();
  }

 
  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      username: this.username,
   
      cars: this.cars.map(car => ({
        carType: car.carType || null, 
        carPhoto: car.carPhoto || null,
      })),
      token: this.token,
      createdAt: this.createdAt,
    };
  }
}

export default User;
