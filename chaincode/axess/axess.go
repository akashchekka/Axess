package main

import (
	"fmt"
	"strings"
	"encoding/json"
	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {	
}

type Account struct {
	Owner string `json:"owner"`
	Name string `json:"name"`
	Hash string `json:"hash"`
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	
	// args := stub.GetStringArgs()
	// if len(args) != 3 {
	// 	return shim.Error("Incorrect arguments")
	// }
	// owner := strings.ToLower(args[0])
	// name := strings.ToLower(args[1])
	// hash := strings.ToLower(args[2])
	
	// account := &Account{owner, name, hash}
	// accountJSONasBytes, err := json.Marshal(account)
	// if err!=nil {
	// 	return shim.Error(err.Error())
	// }
	// err = stub.PutState(owner,accountJSONasBytes)
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fn, args := stub.GetFunctionAndParameters()
	var result string
	var err error
	
	if fn == "get" {
		result, err = get(stub, args)
	} else if fn == "addhash" {
		result, err = addhash(stub, args)
	} else if fn == "getHashByName" {
		result, err = getHashByName(stub, args)
	} else if fn == "ownerEnroll" {
		result, err = ownerEnroll(stub, args)
	} else if fn == "transferHash" {
		result, err = transferHash(stub, args)
	} else if fn == "getnames" {
		result, err = getnames(stub, args)
	}
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte(result))
}

func getnames(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Expecting one argument")
	}
	id := args[0]
	idAsBytes, _ := stub.GetState(id)
	idAccount := Account{}
	json.Unmarshal(idAsBytes, &idAccount)

	names := idAccount.Name
	return string(names), nil
}

func transferHash(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 3 {
		return "", fmt.Errorf("Expecting from, to, name as arguments")
	}

	from := args[0]
	to := args[1]

	fromAsBytes, _ := stub.GetState(from)
	fromAccount := Account{}
	json.Unmarshal(fromAsBytes, &fromAccount)

	toAsBytes, _ := stub.GetState(to)
	toAccount := Account{}
	json.Unmarshal(toAsBytes, &toAccount)

	fromNameArray := strings.Split(fromAccount.Name, ",")
	fromHashArray := strings.Split(fromAccount.Hash, ",")
	
	var temp1 string=""
	var temp2 string=""
 	for i,x := range fromNameArray {
		if x == args[2] {
			temp1 = fromNameArray[i]
			temp2 = fromHashArray[i]
		}
	}

	if temp1 == "" {
		return "Name doesnot exist", nil
	} else{
		toAccount.Name = toAccount.Name + "," + temp1
		toAccount.Hash = toAccount.Hash + "," + temp2
	}

	toAsBytes, _ = json.Marshal(toAccount)
	stub.PutState(to, toAsBytes)

	return "Transfer is successful", nil
}

func ownerEnroll(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Expecting only 1 argument")
	}

	var account = Account{Owner: args[0], Name: "", Hash: ""}
	accountAsBytes, _ := json.Marshal(account)

	stub.PutState(args[0], accountAsBytes)
	return "Owner account opened", nil
}

func getHashByName(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 2 {
		return "", fmt.Errorf("Incorrect Arguments")
	}

	accountAsBytes, _ := stub.GetState(args[0])
	account := Account{}
	json.Unmarshal(accountAsBytes, &account)

	nameAsArray := strings.Split(account.Name, ",")
	hashAsArray := strings.Split(account.Hash, ",")

	var temp string=""
	for i,x := range nameAsArray {
		if x == args[1]{
			temp = hashAsArray[i]
		}
	}

	if temp == "" {
		return "Hash not found", nil
	} else {
		return string(temp), nil
	}
}

func addhash(stub shim.ChaincodeStubInterface, args []string) (string, error){
	if len(args) != 3 {
		return "", fmt.Errorf("Incorrect Arguments")
	}
	accountAsBytes, _ := stub.GetState(args[0])
	account := Account{}
	json.Unmarshal(accountAsBytes, &account)

	if len(account.Name) != 0 {
		account.Name = account.Name + "," + args[1]
		account.Hash = account.Hash + "," + args[2]
	} else {
		account.Name = account.Name + args[1]
		account.Hash = account.Hash + args[2]
	}

	accountAsBytes, _ = json.Marshal(account)
	stub.PutState(args[0], accountAsBytes)

	return "Hash added successfully", nil
}

func get(stub shim.ChaincodeStubInterface, args []string) (string, error) {
	if len(args) != 1 {
		return "", fmt.Errorf("Incorrect arguments")
	}
	value, err := stub.GetState(args[0])
	if err != nil {
		return "", fmt.Errorf("Failed to fetch asset!!!")
	}
	
	if value == nil {
		return "",fmt.Errorf("Account not found")
	}
	return string(value), nil
}