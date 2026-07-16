AWS_DEFAULT_REGION=us-east-1

aws cloudformation deploy \
    --template-file ./test.yaml \
    --stack-name "CtJ-bucket" \
    --s3-prefix "CtJ" \
    --no-execute-changeset \
    --capabilities CAPABILITY_NAMED_IAM

    # Need to create lambda, s3 bucket, configure lambda execution role?, and uhhm subscribe the lambda to the s3 putobject events...