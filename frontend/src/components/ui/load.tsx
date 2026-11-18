import React from 'react';

interface ServerCreationLoadingProps {
  show: boolean;
}

const ServerCreationLoading: React.FC<ServerCreationLoadingProps> = ({ show }) => {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const addServerForm = document.getElementById('addServerForm');
  const modalFooter = document.querySelector('.modal-footer');
  
  if (show) {
    loadingOverlay?.classList.add('active');
    if (addServerForm) addServerForm.style.pointerEvents = 'none';
    if (modalFooter) (modalFooter as HTMLElement).style.visibility = 'hidden';
  } else {
    loadingOverlay?.classList.remove('active');
    if (addServerForm) addServerForm.style.pointerEvents = 'auto';
    if (modalFooter) (modalFooter as HTMLElement).style.visibility = 'visible';
  }

  return null; // Questo componente non renderizza nulla, gestisce solo effetti collaterali
};

export default ServerCreationLoading;