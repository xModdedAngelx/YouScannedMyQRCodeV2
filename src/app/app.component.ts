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
  entireLog: any
  displayedColumns = ["name", "location", "timestamp"]

  usersIP: string | undefined;
  userFingerprint: string | undefined;
  userUnique: boolean | undefined
  roughLocation: string | undefined;

  timeOfScan: string | undefined;
  userPlatform: string | undefined;
  userAgent: string | undefined;
  userColorDepth: string | undefined;
  userHardwareConcurrency: string | undefined
  totalNumberOfScans = -1

  constructor(private http: HttpClient, firestore: AngularFirestore) {
    this.items = firestore.collection('scan-logs').valueChanges();

    this.items.subscribe(data => {
      this.entireLog = data
      this.totalNumberOfScans = data.length
    })

    this.getScanLogs(firestore).then(logs => {
      this.getUserIP().then(ip => {
        this.generateFingerPrint().then(fingerprint => {
          this.determineIfUniqueUser().then(isUnique => {
            if (isUnique) {
              this.writeFirstTimeUserLog(firestore, ip)
            }
          })
        })
      })
    })

  }

  writeFirstTimeUserLog(firestore: AngularFirestore, ip:any) {
    this.getRoughLocation(ip).then(roughLocation => {
      this.getCurrentTime().then(currentTime => {
        firestore.collection('scan-logs').doc(this.userFingerprint).set({
          name: this.generateAnonymousUserName(),
          location: roughLocation,
          timestamp: currentTime,
          fingerprint: this.userFingerprint,
          roughLocation: true
        })
      })
    })

  }

  getRoughLocation(ip: string) {
    return new Promise(resolve => {
      fetch("https://api.ipgeolocation.io/ipgeo?apiKey=14a56634cf264cc6b289b2f8f07297b7&ip="+ip)
        .then(response => response.json())
        .then(data => {
          const city = data.city;
          const region = data.state_prov;
          this.roughLocation = city + ", " + region
          resolve(city + ", " + region);
        })
        .catch(error => console.error(error));
    })
  }

  getScanLogs(firestore: AngularFirestore) {
    return new Promise((resolve) => {
      this.items = firestore.collection('scan-logs').valueChanges();
      this.items.subscribe(data => {
        this.entireLog = data
        this.totalNumberOfScans = data.length
        resolve(data)
      })
    })
  }

  generateFingerPrint() {
    return new Promise((resolve) => {
      var screenPrint = screen.width + "x" + screen.height;
      var colorDepth = this.getUserColorDepth();
      var userAgent = this.getUserAgent();
      var platform = this.getUserPlatform();
      var userHardwareConcurrency = this.getUserHardwareConcurrency();
      let fingerPrint = btoa(screenPrint + colorDepth + userAgent + this.usersIP + platform) +
        userHardwareConcurrency;
      console.log("Your finger print is: " + fingerPrint);
      this.userFingerprint = fingerPrint
      resolve(fingerPrint);
    });
  }


  determineIfUniqueUser() {
    return new Promise((resolve) => {
      for (let element of this.entireLog) {
        if (element.fingerprint == this.userFingerprint) {
          console.log("User is not unique")
          this.userUnique = false
          resolve(false)
          return
        }
      }
      console.log("User is unique")
      this.userUnique = true
      resolve(true)
      return
    })

  }

  generateAnonymousUserName() {
    return "Anonymous" + Math.floor(Math.random() * 100000);
  }

  getUserHardwareConcurrency() {
    this.userHardwareConcurrency = navigator.hardwareConcurrency.toString()
    console.log(this.userHardwareConcurrency)
    return navigator.hardwareConcurrency.toString()
  }

  getUserColorDepth() {
    this.userColorDepth = screen.colorDepth.toString()
    return screen.colorDepth
  }

  getUserAgent() {
    this.userAgent = navigator.userAgent
    return navigator.userAgent
  }

  getUserPlatform() {
    this.userPlatform = navigator.platform
    return navigator.platform
  }

  getUserIP() {
    return new Promise((resolve) => {
      this.http.get('https://api.ipify.org', { responseType: 'text' })
        .subscribe((ip) => {
          this.usersIP = ip;
          resolve(ip)
        });
    })
  }

  getCurrentTime() {
    return new Promise(resolve => {
      let now = new Date();
      this.timeOfScan = now.toLocaleString();
      resolve(now.toLocaleString())
    })

  }

}