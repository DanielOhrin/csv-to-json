AWS_DEFAULT_REGION=us-east-1

aws cloudformation deploy \
    --template-file ./test.yaml \
    --stack-name "CtJ-bucket" \
    --s3-prefix "CtJ" \
    --no-execute-changeset
