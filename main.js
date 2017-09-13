var http = require('http')
var fs = require('fs')

// execute calls and output validated users
var endpoint = "http://backend-challenge-winter-2017.herokuapp.com/customers.json"
getCustomerData(endpoint, 1)

// global variables used during execution
var validations = ''
var customers = ''

// recursively obtains all validation and customer data while the data exists
function getCustomerData(endpoint, startingPage){
    console.log("Getting customer data from endpoint page "+startingPage+".")
    http.get(endpoint + '?page='+ startingPage , function(res){
        var body = ''
        res.on('data', function(chunk){
            body += chunk
        })
    
        res.on('end', function(){
            var response = JSON.parse(body);

            if (validations == '')
                validations = response.validations

            if (customers == '') customers = response.customers
            else
                response.customers.forEach(function(element){
                    customers.push(element)
                })

            var pag = response.pagination
            if (pag.current_page * pag.per_page < pag.total)
                getCustomerData(endpoint, startingPage + 1)
            else verifyData()
        })
    }).on('error', function(e){
        console.log(e)
    })
}

// verifys the customer information with the validation data
function verifyData(){
    console.log("Found "+customers.length+" customers. Verifying their data...")

    // start our primary JSON object used for output
    var invalidCustomers = { "invalid_customers" : [] }
    
    // for each customer
    customers.forEach(function(customer){
        // start our JSON object for the potential invalid customer
        var invalidCustomer = { "id": 0, "invalid_fields": []}
        invalidCustomer.id = customer.id

        // for each property validation
        validations.forEach(function(validation){
            var custProp = Object.keys(validation)[0]
            var propValid = validation[custProp]
            
            // required validation
            if (customer[custProp] == null){
                if (propValid.required == true)
                    invalidCustomer.invalid_fields.push(custProp)
            }
            // type validation
            else if (propValid.type && propValid.type != typeof(customer[custProp])){
                invalidCustomer.invalid_fields.push(custProp)
            }
            // length validation
            else if (propValid.length
                && ((propValid.length.min && propValid.length.min > customer[custProp].length)
                || (propValid.length.max && propValid.length.max < customer[custProp].length)))
                invalidCustomer.invalid_fields.push(custProp)
        })
        
        // add the customer to the main returned JSON if it has an invalid field
        if (invalidCustomer.invalid_fields.length != 0)
            invalidCustomers.invalid_customers.push(invalidCustomer)
    })

    writeJSONToFile(invalidCustomers)
}

// writes JSON data to an output.txt file
function writeJSONToFile(data){
    fs.writeFile("./output.txt", JSON.stringify(data, null, 2), function(error){
        if (error) return console.log(error)

        console.log("Invalid customer data has been written to output.txt.")
        console.log("Process completed.")
    })
}