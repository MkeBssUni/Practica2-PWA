if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service worker registered -->', reg);
      }, (err) => {
        console.error('Service worker not registered -->', err);
      });
  }











  async function Registrar() {
    let data = {
      id: Date.now(),
      email: document.getElementById("emailText").value,
      first_name: document.getElementById("firstNameText").value,
      last_name: document.getElementById("LastNameText").value,
      avatar: document.getElementById("imgAvatar").value
    };
    let a = document.forms["formRegister"]["imgAvatar"].value;
    let b = document.forms["formRegister"]["emailText"].value;
    let c = document.forms["formRegister"]["firstNameText"].value;
    let d = document.forms["formRegister"]["LastNameText"].value;
    try {
  
      if (a == "" || b == "" || c == "" || d == "") {
        alert("Todos los campos deben estar llenos");
      } else {
  
        const request = await fetch('https://reqres.in/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
          body: JSON.stringify(data)
        })
  
        const response = await request.json()
  
        swal({
          title: "Registro correcto!",
          text: "Los datos son: " + JSON.stringify(response),
          icon: "success",
          button: "Salir!",
        });
      }
      //alert('success: ' + JSON.stringify(response));
    } catch (error) {
      alert(error);
    }
  
  }





//listeners
const btnSave = document.getElementById('btnSave');
btnSave.addEventListener('click', saveNote) 

const saveNote = async ()=>{
    const nota = {
        text:'',
        create_at:new Date()
    }
    const txtNote = document.getElementById('note');
    nota.text = txtNote.value
    const generatedId = await createNoteFire(nota);
    if(generatedId !== 'no-create'){
        txtNote.value='';
        alert('Nota creada')
        getAllNote();
    }else{
        alert('Ocurrió un error')
    }
}

getAllNote()
getAllMovies()




