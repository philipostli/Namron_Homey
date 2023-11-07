'use strict';

const { Driver } = require('homey');  

  
class t7e_zg_Driver extends Driver {
 
  async onInit() {
    this.log('@@@t7e_zg_Driver has been initialized');
 
  } 

  async ready(){
    this.log('@@@t7e_zg_Driver.ready')
  } 
  
}

module.exports = t7e_zg_Driver;