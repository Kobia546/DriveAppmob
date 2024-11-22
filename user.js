class User {
  constructor(uid, contact, username, cars, token) {
    this.uid = uid;
    // Détermine si le contact est un email ou un numéro de téléphone
    this.email = contact.includes('@') ? contact : '';
    this.phone = !contact.includes('@') ? contact : '';
    this.username = username;
    this.cars = cars;
    this.token = token;
    this.createdAt = new Date();
  }
 
  toFirestore() {
    return {
      uid: this.uid,
      email: this.email,
      phone: this.phone,
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