

fetch('https://reqres.in/api/users')
  .then(response => response.json())
  .then(data => {



    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../service-worker.js')
        .then((reg) => {
          console.log('Service worker registered -->', reg);
        }, (err) => {
          console.error('Service worker not registered -->', err);
        });
    }

    console.log(data)
    let tab = ``;

    // Loop to access all rows
    for (let r of data.data) {
      tab += ` 
                        <div class="col-sm-3 mb-5">  
                            <div class="card">
                                <img class="center"  style="display: block;margin-left: auto;margin-right: auto; width:80%;" src="${r.avatar}" alt="">
                                <div class="card-body">
                                    <h5 class="card-title">${r.first_name}</h5>
                                    <p class="card-text">${r.last_name}</p>
                                    <p class="card-text">${r.email}</p>
                                </div>  
                            </div>
                        </div> 
               
                    `;

    }


    // Setting innerHTML as tab variable
    document.getElementById("datosregistrados").innerHTML = tab;
  });