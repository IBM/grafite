from grafite.validators.llmjudge.templates import t1, t2, t3

def get_template(judge_type:str = None):
    if not judge_type:
        return None
    
    judge_type = judge_type.lower()
    if "prompt template 1" in judge_type:
        return t1()
    elif "prompt template 2" in judge_type:
        return t2()
    elif "prompt template 3" in judge_type:
        return t3()
    return None