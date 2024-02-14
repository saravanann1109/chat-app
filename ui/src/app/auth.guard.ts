import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {

  if(localStorage.getItem("user") != null && localStorage.getItem("user") != undefined &&
  localStorage.getItem("user") != "") {
    return true;

  }
   
  window.location.href = '/login';  
  return false;
};
