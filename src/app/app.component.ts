import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  items: Observable<any[]> | undefined;
  entireLog:any
  displayedColumns = ["ip", "location", "dateOfScan"]
  
  usersIP:string | undefined;
  userslatitude: number | undefined;
  userslongitude: number | undefined;
  usersCity:string | undefined;
  usersState:string | undefined;
  timeOfScan:string | undefined;
  userPlatform:string | undefined;
  userAgent:string | undefined;
  userColorDepth:string | undefined;
  userHardwareConcurrency:string | undefined
  totalNumberOfScans = -1

  constructor(private http: HttpClient, firestore: AngularFirestore) {
    this.getUserIP()
    this.getCurrentLocation()
    this.getCurrentTime()
    this.getUserAgent()
    this.getUserPlatform()

    this.items = firestore.collection('scan-logs').valueChanges();

    this.items.subscribe(data => {
      console.log(data)
      this.entireLog = data
      this.totalNumberOfScans = data.length
    })

    let yourFingerprint = this.generateFingerPrint()
    
    setTimeout(()=>{
      firestore.collection('scan-logs').doc(Math.random().toString(36).substring(2,12)).set({
        ip: this.usersIP,
        location: this.usersCity,
        dateOfScan: this.timeOfScan,
      })
    },1000)

  }

  generateFingerPrint(){
      var screenPrint = screen.width + "x" + screen.height;
      var colorDepth = this.getUserColorDepth()
      var userAgent = this.getUserAgent()
      var ip = this.getUserIP()
      var platform = this.getUserPlatform()
      var userHardwareConcurrency = this.getUserHardwareConcurrency()
      let fingerPrint = btoa(screenPrint + colorDepth + userAgent + ip + platform) + userHardwareConcurrency;
      console.log("Your finger print is: " + fingerPrint)
      return fingerPrint;
    
  
  }


  getUserHardwareConcurrency(){
    this.userHardwareConcurrency = navigator.hardwareConcurrency.toString()
    console.log(this.userHardwareConcurrency)
    return navigator.hardwareConcurrency.toString()
  }

  getUserColorDepth(){
    this.userColorDepth = screen.colorDepth.toString()
    return screen.colorDepth
  }

  getUserAgent(){
    this.userAgent = navigator.userAgent
    return navigator.userAgent
  }

  getUserPlatform(){
    this.userPlatform = navigator.platform
    return navigator.platform
  }

  getUserIP() {
    this.http.get('https://api.ipify.org', { responseType: 'text' })
      .subscribe((ip) => {
        this.usersIP = ip;
        return ip
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