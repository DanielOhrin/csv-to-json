AWS_DEFAULT_REGION="us-east-1"

aws cloudformation deploy \
  --template-file test_cfn_bucket.yaml \
  --stack-name cfn-bucket

CFN_BUCKET=$(aws cloudformation describe-stacks --region "$AWS_DEFAULT_REGION" \
 --query "Stacks[?StackName == 'cfn-bucket'].Outputs[?OutputKey == BucketName] | [0] | [0].OutputValue" \
 --output text)

aws cloudformation package \
    --template-file test.yaml \
    --output-template-file test-packaged.yaml \
    --s3-bucket "$CFN_BUCKET"

aws cloudformation deploy \
    --template-file ./test-packaged.yaml \
    --stack-name "CtJ-bucket" \
    --s3-prefix "CtJ" \
    --no-execute-changeset \
    --capabilities CAPABILITY_NAMED_IAM