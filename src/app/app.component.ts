import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'test'
  usersIP:string | undefined;
  userslatitude: number | undefined;
  userslongitude: number | undefined;
  usersCity:string | undefined;
  usersState:string | undefined;
  timeOfScan:string | undefined;

  constructor(private http: HttpClient) {
    this.getUserIP()
    this.getCurrentLocation()
    this.getCurrentTime()
  }

  getUserIP() {
    this.http.get('https://api.ipify.org', { responseType: 'text' })
      .subscribe((ip) => {
        this.usersIP = ip;
        console.log(ip);
      });
  }

  getCurrentLocation(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this.userslatitude = position.coords.latitude;
        this.userslongitude = position.coords.longitude;
        this.getApproximateLocation();
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  getApproximateLocation(){
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${this.userslatitude}&lon=${this.userslongitude}`)
    .then(response => response.json())
    .then(data => {
      const address = data.address.road + ", " + data.address.town + ", " + data.address.state + ", " + data.address.country;
      console.log(`Address: ${address}`);
      this.usersState = data.address.state
      this.usersCity = data.address.town
    })
    .catch(error => console.error(error));
  }

  getCurrentTime() {
    let now = new Date();
    this.timeOfScan = now.toLocaleString();
    console.log(this.timeOfScan)
  }


}