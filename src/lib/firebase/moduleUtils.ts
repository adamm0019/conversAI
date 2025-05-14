import { collection, doc, getDocs, setDoc, query, where, Timestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AIModule } from '../../hooks/useModulePlanner';

export const saveModuleToFirebase = async (module: AIModule): Promise<void> => {
  try {
    const moduleRef = doc(db, 'modules', module.id);
    await setDoc(moduleRef, {
      ...module,
      updatedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {

    throw error;
  }
};

export const saveModulesToFirebase = async (modules: AIModule[]): Promise<void> => {
  try {
    const promises = modules.map(module => saveModuleToFirebase(module));
    await Promise.all(promises);
  } catch (error) {
    throw error;
  }
};

export const checkModulesExist = async (): Promise<boolean> => {
  try {
    const modulesRef = collection(db, 'modules');
    const modulesSnapshot = await getDocs(modulesRef);
    return !modulesSnapshot.empty;
  } catch (error) {
    return false;
  }
};

export const getAllModules = async (): Promise<AIModule[]> => {
  try {
    const modulesRef = collection(db, 'modules');
    const modulesSnapshot = await getDocs(modulesRef);
    
    if (modulesSnapshot.empty) {
      return [];
    }
    
    return modulesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as AIModule[];
  } catch (error) {

    throw error;
  }
};

export const getModuleById = async (moduleId: string): Promise<AIModule | null> => {
  try {
    const moduleRef = doc(db, 'modules', moduleId);
    const moduleSnapshot = await getDoc(moduleRef);
    
    if (!moduleSnapshot.exists()) {
      return null;
    }
    
    return {
      ...moduleSnapshot.data(),
      id: moduleSnapshot.id
    } as AIModule;
  } catch (error) {

    throw error;
  }
};

export const deleteAllModules = async (): Promise<void> => {
  try {
    const modulesRef = collection(db, 'modules');
    const modulesSnapshot = await getDocs(modulesRef);
    
    if (modulesSnapshot.empty) {
      return;
    }
    
    const deletePromises = modulesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {

    throw error;
  }
}; 