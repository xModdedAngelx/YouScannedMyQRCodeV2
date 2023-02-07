import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {MatSnackBar} from '@angular/material/snack-bar';
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
  hasAccessToBrowserLocation: boolean | undefined
  displayedLocation: string | undefined;
  changeNameValue = "";
  
  existingUserExactLocation: string | undefined;
  existingUserlocation: string | undefined;
  existingUserName: string | undefined;
  existingUserTimestamp: string | undefined;
  existingUserMessage: string | undefined;

  timeOfScan: string | undefined;
  userPlatform: string | undefined;
  userAgent: string | undefined;
  userColorDepth: string | undefined;
  userHardwareConcurrency: string | undefined
  totalNumberOfScans: number | undefined

  constructor(private http: HttpClient, private firestore: AngularFirestore, private _snackBar: MatSnackBar) {
    this.items = firestore.collection('scan-logs').valueChanges();

    this.items.subscribe(data => {
      this.entireLog = data
      this.totalNumberOfScans = data.length
      this.reorderDataByDate()
    })

    this.getScanLogs(firestore).then(logs => {
      this.getUserIP().then(ip => {
        this.generateFingerPrint().then(fingerprint => {
          this.determineIfUniqueUser().then(isUnique => {
            if (isUnique) {
              this.writeFirstTimeUserLog(firestore, ip)
            }
              //Code that runs if the user is not unique
              this.setNotUniqueInfo(fingerprint, firestore)
          })
        })
      })
    })
  }

  reorderDataByDate(){
    this.entireLog = this.entireLog.sort((a: { timestamp: string | number | Date; }, b: { timestamp: string | number | Date; }) => {
      const aTimestamp = new Date(a.timestamp);
      const bTimestamp = new Date(b.timestamp);
      return bTimestamp.getTime() - aTimestamp.getTime();
    });
    this.entireLog = [...this.entireLog]
  }

  showMessageSnackbar(message:string) {
    this._snackBar.open(message, 'Close', {
    });
  }

  submitNameChange(){
    this.firestore.collection('scan-logs').doc(this.userFingerprint).set({
      name: this.changeNameValue,
      location: this.existingUserlocation,
      timestamp: this.existingUserTimestamp,
      fingerprint: this.userFingerprint,
      exactLocation: this.existingUserExactLocation,
      message: this.existingUserMessage
    })
  }

  submitMessageChange(){
    this.firestore.collection('scan-logs').doc(this.userFingerprint).set({
      name: this.changeNameValue,
      location: this.existingUserlocation,
      timestamp: this.existingUserTimestamp,
      fingerprint: this.userFingerprint,
      exactLocation: this.existingUserExactLocation,
      message: this.existingUserMessage
    })
  }

  setNotUniqueInfo(fingerprint: any, firestore: AngularFirestore) {
    //Use the finger print to find the user name
    let documentRef = firestore.collection('scan-logs').doc(fingerprint);
    let data = documentRef.valueChanges();

    data.subscribe((output:any) => {
      console.log(output)
      this.changeNameValue = output.name
      this.displayedLocation = output.location
      
      this.existingUserExactLocation = output.exactLocation
      this.existingUserlocation = output.location
      this.existingUserName = output.name
      this.existingUserTimestamp = output.timestamp
      this.existingUserMessage = output.message
      this.reorderDataByDate()
    }); 
  }

  writeFirstTimeUserLog(firestore: AngularFirestore, ip: any) {
    this.getRoughLocation(ip).then(roughLocation => {
      this.getCurrentTime().then(currentTime => {
        this.checkIfAppHasBrowserLocationAccess().then(hasBrowserLocationAccess => {
          console.log("browser location access: " + hasBrowserLocationAccess)
          if (hasBrowserLocationAccess) {
            this.getBrowserLocation().then(exactAddress => {
              firestore.collection('scan-logs').doc(this.userFingerprint).set({
                name: this.generateAnonymousUserName(),
                location: exactAddress,
                timestamp: currentTime,
                fingerprint: this.userFingerprint,
                exactLocation: hasBrowserLocationAccess,
                message: ""
              })
            })
          }
          else {
            firestore.collection('scan-logs').doc(this.userFingerprint).set({
              name: this.generateAnonymousUserName(),
              location: roughLocation,
              timestamp: currentTime,
              fingerprint: this.userFingerprint,
              exactLocation: hasBrowserLocationAccess,
              message: ""
            })
          }
        })
      })
    })
    setTimeout(()=>{
      this.reorderDataByDate()
    },1500)
  }

  checkIfAppHasBrowserLocationAccess() {
    return new Promise(resolve => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.hasAccessToBrowserLocation = true;
            resolve(true)
          },
          (error) => {
            this.hasAccessToBrowserLocation = false;
            resolve(false)
          }
        );
      } else {
        this.hasAccessToBrowserLocation = false;
        resolve(false)
      }
    })
  }


  getBrowserLocation() {
    return new Promise(resolve => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          let latitude = position.coords.latitude;
          let longitude = position.coords.longitude;

          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
            .then(response => response.json())
            .then(data => {
              const address = data.address.road + ", " + data.address.town + ", " + data.address.state;
              this.displayedLocation = address
              resolve(address)
            })
        });
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    })
  }

  getRoughLocation(ip: string) {
    return new Promise(resolve => {
      fetch("https://api.ipgeolocation.io/ipgeo?apiKey=14a56634cf264cc6b289b2f8f07297b7&ip=" + ip)
        .then(response => response.json())
        .then(data => {
          const city = data.city;
          const region = data.state_prov;
          this.roughLocation = city + ", " + region
          this.displayedLocation = this.roughLocation
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
    let name = "Anonymous" + Math.floor(Math.random() * 100000)
    this.changeNameValue = name
    return name;
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